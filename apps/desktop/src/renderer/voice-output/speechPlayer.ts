/**
 * 语音模式播放器（renderer 单例）。
 *
 * 合成链路：优先 Cindy 云端 TTS（electronAPI.voiceOutput.synthesize，与语音
 * 输入同一账号体系）；服务端尚未部署 TTS 会话（CLOUD_TTS_UNAVAILABLE）或其他
 * 云端故障时，无缝降级系统语音（speechSynthesis）。降级结果带 TTL 记忆，
 * 避免每条回复都白等一次失败往返。
 *
 * 互斥：云端音频走 <audio> 并注册 mediaPlaybackBus（与聊天里的音频/视频卡片
 * 互斥）；speechSynthesis 不在总线上，开始前显式 stopAllMedia() + cancel。
 * 新的 speak() 永远打断上一次（generation 计数）。
 */

import { stopAllMedia } from '@/lib/mediaPlaybackBus';
import { clampSpeechText } from './speechText';
import { getVoiceTtsModel } from './voiceModePreference';

export type SpeechPlaybackState = 'idle' | 'speaking';

type StateListener = (state: SpeechPlaybackState) => void;

const CLOUD_TTS_FAILURE_TTL_MS = 10 * 60 * 1000;

let cloudTtsUnavailableUntil = 0;
let generation = 0;
let audioEl: HTMLAudioElement | null = null;
const listeners = new Set<StateListener>();
let currentState: SpeechPlaybackState = 'idle';

function setState(next: SpeechPlaybackState): void {
  if (currentState === next) return;
  currentState = next;
  for (const listener of listeners) listener(next);
}

export function getSpeechPlaybackState(): SpeechPlaybackState {
  return currentState;
}

export function onSpeechPlaybackStateChange(listener: StateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function ensureAudioElement(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = 'auto';
  }
  return audioEl;
}

function stopSpeechSynthesis(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* speechSynthesis 缺失/异常时静默 —— 云端路径不受影响。 */
  }
}

function stopCloudAudio(): void {
  if (!audioEl) return;
  try {
    audioEl.pause();
  } catch {
    /* 元素尚未就绪等瞬时态：静默。 */
  }
}

/** 停止当前朗读（云端音频 + 系统语音一起停）。 */
export function stopSpeaking(): void {
  generation += 1;
  stopSpeechSynthesis();
  stopCloudAudio();
  setState('idle');
}

function speakWithCloud(text: string, gen: number): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (played: boolean): void => {
      if (settled) return;
      settled = true;
      resolve(played && gen === generation);
    };
    void window.electronAPI.voiceOutput
      .synthesize({
        text,
        ...(getVoiceTtsModel()
          ? { modelId: getVoiceTtsModel()!.modelId, providerId: getVoiceTtsModel()!.providerId }
          : {}),
      })
      .then((result) => {
        if (gen !== generation) return finish(false);
        if (!result.ok) {
          // 云端不可用：TTL 内不再重试，后续直接走系统语音。
          if (result.code === 'CLOUD_TTS_UNAVAILABLE' || result.code === 'NOT_LOGGED_IN' || result.code === 'REGION_UNAVAILABLE') {
            cloudTtsUnavailableUntil = Date.now() + CLOUD_TTS_FAILURE_TTL_MS;
          }
          return finish(false);
        }
        const el = ensureAudioElement();
        const blob = new Blob([new Uint8Array(atob(result.audioBase64).split('').map((c) => c.charCodeAt(0)))], {
          type: result.mime,
        });
        const url = URL.createObjectURL(blob);
        const cleanup = (): void => {
          URL.revokeObjectURL(url);
        };
        el.onended = () => {
          cleanup();
          finish(true);
        };
        el.onerror = () => {
          cleanup();
          finish(false);
        };
        el.src = url;
        void el.play().catch(() => {
          cleanup();
          finish(false);
        });
      })
      .catch(() => finish(false));
  });
}

function speakWithSystemVoice(text: string, gen: number): Promise<boolean> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) return resolve(false);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => resolve(gen === generation);
    utterance.onerror = () => resolve(false);
    synth.speak(utterance);
  });
}

/**
 * 朗读一段文本。新的调用会打断上一次；返回的 promise 在播完或被打断时
 * resolve（不 reject —— 朗读失败属于可忽略的体验降级，不该炸调用方）。
 */
export async function speak(rawText: string): Promise<void> {
  const text = clampSpeechText(rawText.trim());
  if (!text) return;
  generation += 1;
  const gen = generation;
  // 系统语音与云端音频互相排斥，也要压掉聊天流里正在播的媒体。
  stopSpeechSynthesis();
  stopAllMedia();
  setState('speaking');
  try {
    if (Date.now() < cloudTtsUnavailableUntil) {
      await speakWithSystemVoice(text, gen);
      return;
    }
    const playedByCloud = await speakWithCloud(text, gen);
    if (gen !== generation) return;
    if (!playedByCloud) {
      await speakWithSystemVoice(text, gen);
    }
  } finally {
    if (gen === generation) setState('idle');
  }
}

/** 测试用：清空模块级状态。 */
export function __resetSpeechPlayerForTests(): void {
  generation += 1;
  cloudTtsUnavailableUntil = 0;
  audioEl = null;
  setState('idle');
}
