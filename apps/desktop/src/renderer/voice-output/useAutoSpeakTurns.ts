/**
 * 语音模式自动朗读 hook：监视消息流里「turn 收尾 assistant 正文」的新增，
 * 出现新收尾回复且语音模式打开时自动朗读。
 *
 * 口径与 action bar 完全一致（collectTurnFinalAssistantClientIds）：
 * 只读任务结束的最后一句话，不读过程性中间输出。
 *
 * 基线规则：挂载（以及会话切换导致的重新挂载，MessageStream 以 sessionId 为
 * key）时，把已存在的收尾消息全部标记为已读 —— 语音模式只读「我在场期间
 * 新完成的回复」，不回放历史。关闭语音模式期间完成的回复同样标记已读，
 * 重新打开不会突然读出积压的旧回复。
 */

import { useEffect, useRef } from 'react';

import type { ChatMessage } from '@/hooks/useCCAgentChat';
import { speak, stopSpeaking } from './speechPlayer';
import { speechTextFromMarkdown } from './speechText';

export function useAutoSpeakTurns(options: {
  messages: readonly ChatMessage[];
  turnFinalClientIds: ReadonlySet<string>;
  enabled: boolean;
}): void {
  const { messages, turnFinalClientIds, enabled } = options;
  const seenClientIdsRef = useRef<Set<string> | null>(null);
  const messageByIdRef = useRef<Map<string, ChatMessage>>(new Map());

  useEffect(() => {
    const byId = new Map<string, ChatMessage>();
    for (const message of messages) {
      if (message.clientId) byId.set(message.clientId, message);
    }
    messageByIdRef.current = byId;
  }, [messages]);

  useEffect(() => {
    // 基线初始化 / 重置：首次挂载与会话切换（seen 为 null）时静默收录全部。
    if (seenClientIdsRef.current === null) {
      seenClientIdsRef.current = new Set(turnFinalClientIds);
      return;
    }
    const seen = seenClientIdsRef.current;
    const fresh: string[] = [];
    for (const clientId of turnFinalClientIds) {
      if (!seen.has(clientId)) {
        fresh.push(clientId);
        seen.add(clientId);
      }
    }
    if (fresh.length === 0) return;
    if (!enabled) return;
    // 只读最后一条新增收尾（一次 steer 批量落库时避免连读多条）。
    const targetId = fresh[fresh.length - 1];
    const message = messageByIdRef.current.get(targetId);
    if (!message || message.role !== 'assistant') return;
    const speechText = speechTextFromMarkdown(message.content ?? '');
    if (!speechText) return;
    void speak(speechText);
  }, [turnFinalClientIds, enabled]);

  // 卸载（含会话切换）时停掉还在播的朗读。
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);
}
