/**
 * 「语音模式」用户偏好（renderer 本地 store）。
 *
 * 语音模式是一个轻量 UI 偏好（布尔），与 composer 发送快捷键偏好同层：
 * localStorage 持久化、可随时从聊天输入框一键切换。默认关闭——不打扰
 * 不想被朗读的用户；打开后所有伙伴回复自动朗读。
 *
 * 同层还存「语音朗读合成模型」：缺省（空串）= 自动（Cindy 语音服务内置
 * TTS 优先，不可用降级系统语音）；用户在设置里从模型目录的 tts 分类选定
 * 模型后，云端合成改走 XD 网关 /v1/audio/speech。
 *
 * 写入方是聊天输入框的开关按钮 / 设置页，读取方是 MessageStream 的自动
 * 朗读 hook，两边不一定同挂载树，所以用模块级 store + useSyncExternalStore 对齐。
 */

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'chat.voiceModeEnabled';
const TTS_MODEL_STORAGE_KEY = 'chat.voiceTtsModel';
/** 旧版单值 key（隐含 xd 网关）；读到时迁移成对象后移除。 */
const LEGACY_TTS_MODEL_STORAGE_KEY = 'chat.voiceTtsModelId';

let cachedState = readFromStorage();
const subscribers = new Set<() => void>();

function readFromStorage(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setVoiceModeEnabled(enabled: boolean): void {
  if (enabled === cachedState) return;
  cachedState = enabled;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    /* localStorage 不可用时退化为会话内内存态。 */
  }
  for (const notify of subscribers) notify();
}

function subscribe(notify: () => void): () => void {
  subscribers.add(notify);
  return () => subscribers.delete(notify);
}

function getSnapshot(): boolean {
  return cachedState;
}

/** 语音模式开关的响应式读取。写入走 setVoiceModeEnabled。 */
export function useVoiceModeEnabled(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ── 语音朗读合成模型（{providerId, modelId}；null = 自动）──
// providerId 缺省 'xd'（Cindy AI 网关）；自定义供应商存其 id。

export type VoiceTtsModelChoice = { providerId: string; modelId: string };

let cachedTtsModel: VoiceTtsModelChoice | null = readTtsModel();
const ttsModelSubscribers = new Set<() => void>();

function readTtsModel(): VoiceTtsModelChoice | null {
  try {
    const raw = window.localStorage.getItem(TTS_MODEL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { providerId?: unknown; modelId?: unknown };
      if (
        typeof parsed.providerId === 'string'
        && parsed.providerId.length > 0
        && typeof parsed.modelId === 'string'
        && parsed.modelId.length > 0
      ) {
        return { providerId: parsed.providerId, modelId: parsed.modelId };
      }
      return null;
    }
    // 旧版单值 key：纯 modelId，当时只能走 xd 网关。
    const legacy = window.localStorage.getItem(LEGACY_TTS_MODEL_STORAGE_KEY);
    if (legacy) {
      window.localStorage.removeItem(LEGACY_TTS_MODEL_STORAGE_KEY);
      const choice = { providerId: 'xd', modelId: legacy };
      window.localStorage.setItem(TTS_MODEL_STORAGE_KEY, JSON.stringify(choice));
      return choice;
    }
  } catch {
    /* localStorage 不可用/值损坏：按未配置处理。 */
  }
  return null;
}

export function setVoiceTtsModel(choice: VoiceTtsModelChoice | null): void {
  const next = choice && choice.providerId && choice.modelId ? choice : null;
  const same =
    (cachedTtsModel === null && next === null)
    || (cachedTtsModel !== null
      && next !== null
      && cachedTtsModel.providerId === next.providerId
      && cachedTtsModel.modelId === next.modelId);
  if (same) return;
  cachedTtsModel = next;
  try {
    if (next) window.localStorage.setItem(TTS_MODEL_STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(TTS_MODEL_STORAGE_KEY);
  } catch {
    /* localStorage 不可用时退化为会话内内存态。 */
  }
  for (const notify of ttsModelSubscribers) notify();
}

export function getVoiceTtsModel(): VoiceTtsModelChoice | null {
  return cachedTtsModel;
}

/** 语音朗读合成模型的响应式读取（设置页消费）。 */
export function useVoiceTtsModel(): VoiceTtsModelChoice | null {
  return useSyncExternalStore(
    (notify) => {
      ttsModelSubscribers.add(notify);
      return () => ttsModelSubscribers.delete(notify);
    },
    getVoiceTtsModel,
    getVoiceTtsModel,
  );
}
