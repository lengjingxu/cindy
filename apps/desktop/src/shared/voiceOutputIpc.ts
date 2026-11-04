/**
 * 语音输出（伙伴说话）共享契约。
 *
 * 「语音模式」打开时，伙伴（assistant）turn 收尾正文会自动朗读。合成优先走
 * Cindy 语音服务（voice-server，与语音输入同一套会话入口），服务端尚未部署
 * TTS 会话时返回 CLOUD_TTS_UNAVAILABLE，renderer 降级系统语音（speechSynthesis），
 * 保证功能开箱可用（产品原则：不想折腾的人也能用）。
 */

export const VOICE_OUTPUT_SYNTHESIZE_CHANNEL = 'voice-output:synthesize';

/** 单次合成请求的正文上限（字符）。超限由 renderer 截断，main 再兜底拒绝。 */
export const VOICE_OUTPUT_MAX_TEXT_CHARS = 4000;

export type VoiceOutputSynthesisRequest = {
  /** 待合成正文（已剥离 markdown 的可读文本）。 */
  text: string;
  /** 可选音色 id；缺省由服务端决定。 */
  voice?: string;
  /**
   * 用户在设置里选定的 TTS 模型 id（模型目录 tts 分类）。
   * 有值时走对应供应商的 OpenAI 兼容 /v1/audio/speech；缺省时先探测
   * Cindy 语音服务的内置 TTS 会话，都没有再由 renderer 降级系统语音。
   */
  modelId?: string;
  /**
   * 模型所属供应商 id；缺省 'xd'（Cindy AI 网关）。自定义供应商
   * （设置 → 模型供应商里添加的）传其 id，main 侧读该供应商的
   * baseUrl + 本机密钥后调用同款端点。
   */
  providerId?: string;
};

export type VoiceOutputSynthesisResult =
  | {
      ok: true;
      /** 音频字节（base64）。 */
      audioBase64: string;
      mime: string;
      /** 实际使用的服务端 provider（诊断用）。 */
      provider: string;
    }
  | {
      ok: false;
      code:
        | 'NOT_LOGGED_IN'
        | 'REGION_UNAVAILABLE'
        | 'CLOUD_TTS_UNAVAILABLE'
        | 'INVALID_TEXT'
        | 'UPSTREAM_FAILED'
        | 'TIMEOUT';
      message: string;
    };

export function normalizeVoiceOutputSynthesisRequest(
  input: unknown,
): VoiceOutputSynthesisRequest | null {
  if (typeof input !== 'object' || input === null) return null;
  const candidate = input as { text?: unknown; voice?: unknown; modelId?: unknown; providerId?: unknown };
  if (typeof candidate.text !== 'string') return null;
  const text = candidate.text.trim();
  if (text.length === 0 || text.length > VOICE_OUTPUT_MAX_TEXT_CHARS) return null;
  const voice =
    typeof candidate.voice === 'string' && candidate.voice.length > 0 && candidate.voice.length <= 128
      ? candidate.voice
      : undefined;
  const modelIdRaw = typeof candidate.modelId === 'string' ? candidate.modelId.trim() : '';
  const modelId = modelIdRaw.length > 0 && modelIdRaw.length <= 256 ? modelIdRaw : undefined;
  const providerIdRaw = typeof candidate.providerId === 'string' ? candidate.providerId.trim() : '';
  // 自定义供应商 id 由 store 保证 /^[a-z0-9_-]+$/；这里再卡一道，防拼接密钥存储键。
  const providerId =
    providerIdRaw.length > 0 && providerIdRaw.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(providerIdRaw)
      ? providerIdRaw
      : undefined;
  return { text, voice, modelId, providerId };
}
