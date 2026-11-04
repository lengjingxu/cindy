/**
 * 语音输出 IPC 注册。唯一的入口：`voice-output:synthesize`。
 *
 * 有意做得很小：开关偏好留在 renderer（localStorage，与 composer 发送快捷键
 * 偏好同级）；main 只承担云端合成（需要 Cindy 账号票据，renderer 不持有）。
 */

import { ipcMain } from 'electron';

import {
  normalizeVoiceOutputSynthesisRequest,
  VOICE_OUTPUT_SYNTHESIZE_CHANNEL,
  type VoiceOutputSynthesisResult,
} from '../../shared/voiceOutputIpc.js';
import { synthesizeSpeech } from './cindyTtsClient.js';

export function registerVoiceOutputIpc(): void {
  ipcMain.handle(
    VOICE_OUTPUT_SYNTHESIZE_CHANNEL,
    async (_event, input: unknown): Promise<VoiceOutputSynthesisResult> => {
      const request = normalizeVoiceOutputSynthesisRequest(input);
      if (!request) {
        return {
          ok: false,
          code: 'INVALID_TEXT',
          message: 'Voice output text is missing, empty, or over the length limit.',
        };
      }
      return synthesizeSpeech(request);
    },
  );
}
