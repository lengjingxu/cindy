/**
 * 语音朗读（伙伴说话）—— mobile 端。
 *
 * 与 desktop 同一套产品语义：会话页的「语音朗读」开关打开后，turn 收尾的
 * 伙伴回复自动朗读（口径同 markTurnFinalAssistants 的 isTurnFinalAssistant，
 * 只读收尾正文、不回放历史）。mobile 音源用系统 TTS（expo-speech，iOS Siri /
 * Android TTS 引擎）；云端合成链路（Cindy 语音服务 / 网关模型）由 desktop 侧
 * 探测式先行，待服务端 TTS 契约落地后两端统一接入。
 *
 * 偏好是轻量布尔，AsyncStorage 持久化（模块级 store + useSyncExternalStore，
 * 对齐 revokedDevicesStore 模式），默认关闭。
 */

import { useEffect, useRef } from 'react';
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

import { clampSpeechText, speechTextFromMarkdown } from '@cindy/maker-shared/speech-text';

import type { RemoteMessage } from './types';
import { normalizeRemoteMessages } from './messageNormalize';
import { markTurnFinalAssistants } from './messageRenderModel';

const ENABLED_STORAGE_KEY = 'session.voiceReadoutEnabled';

// ── 偏好 store ──

let cachedEnabled = false;
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

void AsyncStorage.getItem(ENABLED_STORAGE_KEY)
  .then((raw) => {
    cachedEnabled = raw === 'true';
    hydrated = true;
    emit();
  })
  .catch(() => {
    hydrated = true;
  });

export function setVoiceReadoutEnabled(enabled: boolean): void {
  if (enabled === cachedEnabled) return;
  cachedEnabled = enabled;
  if (!enabled) stopVoiceReadout();
  void AsyncStorage.setItem(ENABLED_STORAGE_KEY, enabled ? 'true' : 'false').catch(() => undefined);
  emit();
}

export function subscribeVoiceReadout(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVoiceReadoutSnapshot(): boolean {
  return cachedEnabled;
}

/** 语音朗读开关的响应式读取。写入走 setVoiceReadoutEnabled。 */
export function useVoiceReadoutEnabled(): boolean {
  return useSyncExternalStore(subscribeVoiceReadout, getVoiceReadoutSnapshot);
}

/** 水合完成前调用方可以选择不渲染开关态（避免首帧闪默认值）。 */
export function isVoiceReadoutHydrated(): boolean {
  return hydrated;
}

// ── 播放（expo-speech）──

export function stopVoiceReadout(): void {
  try {
    Speech.stop();
  } catch {
    /* 引擎不可用时静默 —— 开关切换不应炸 UI。 */
  }
}

export async function speakVoiceReadout(rawText: string): Promise<void> {
  const text = clampSpeechText(speechTextFromMarkdown(rawText));
  if (!text) return;
  try {
    Speech.stop();
    await Speech.speak(text, {
      // 语言跟随系统/引擎默认；不指定 voice，让平台选用户已装的最佳中文声。
      onError: () => {
        /* 朗读失败是可忽略的体验降级，不炸调用方。 */
      },
    });
  } catch {
    /* 引擎缺失（个别模拟器）时静默。 */
  }
}

// ── 自动朗读 hook ──

/**
 * 监视消息流里 turn 收尾 assistant 正文的新增，出现新收尾回复且语音模式
 * 打开时自动朗读。基线规则与 desktop 一致：挂载时把已存在的收尾消息全部
 * 标记为已读 —— 只读「我在场期间新完成的回复」，不回放历史；关闭期间完成
 * 的回复同样标记已读，重新打开不会突然读出积压的旧回复。
 *
 * isSessionStreaming 与渲染管线同源（currentTurnHasStreamingAssistant）：
 * 流式中尾部候选不会被误标为收尾（markTurnFinalAssistants 的 suppress 逻辑），
 * 避免半截回复提前出声、结束后又换 key 重复朗读。
 */
export function useAutoSpeakVoiceReadout(
  messages: readonly RemoteMessage[],
  isSessionStreaming: boolean,
  enabled: boolean,
): void {
  const seenKeysRef = useRef<Set<string> | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const streamingRef = useRef(isSessionStreaming);
  streamingRef.current = isSessionStreaming;

  useEffect(() => {
    if (seenKeysRef.current === null) {
      // 基线初始化：首次挂载把当前收尾消息全部静默收录。
      const normalized = normalizeRemoteMessages(messagesRef.current);
      markTurnFinalAssistants(normalized, streamingRef.current);
      seenKeysRef.current = new Set(
        normalized
          .filter((m) => m.kind === 'assistant' && m.isTurnFinalAssistant)
          .map((m) => m.key),
      );
      return;
    }
    const normalized = normalizeRemoteMessages(messagesRef.current);
    markTurnFinalAssistants(normalized, streamingRef.current);
    const finalMessages = normalized.filter(
      (m) => m.kind === 'assistant' && m.isTurnFinalAssistant && m.body.trim(),
    );
    const seen = seenKeysRef.current;
    const fresh: string[] = [];
    for (const message of finalMessages) {
      if (!seen.has(message.key)) {
        fresh.push(message.key);
        seen.add(message.key);
      }
    }
    if (fresh.length === 0 || !enabled) return;
    // 只读最后一条新增收尾（一次 steer 批量落库时避免连读多条）。
    const targetKey = fresh[fresh.length - 1];
    const target = finalMessages.find((m) => m.key === targetKey);
    if (target) void speakVoiceReadout(target.body);
  }, [messages, enabled]);

  useEffect(() => {
    return () => {
      stopVoiceReadout();
    };
  }, []);
}
