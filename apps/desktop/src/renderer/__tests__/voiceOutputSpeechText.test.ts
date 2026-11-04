import { describe, expect, it } from 'vitest';

import { normalizeVoiceOutputSynthesisRequest, VOICE_OUTPUT_MAX_TEXT_CHARS } from '../../shared/voiceOutputIpc';

describe('normalizeVoiceOutputSynthesisRequest', () => {
  it('拒绝非对象与空文本', () => {
    expect(normalizeVoiceOutputSynthesisRequest(null)).toBeNull();
    expect(normalizeVoiceOutputSynthesisRequest({ text: '   ' })).toBeNull();
    expect(normalizeVoiceOutputSynthesisRequest({ text: 42 })).toBeNull();
  });

  it('拒绝超长文本', () => {
    expect(normalizeVoiceOutputSynthesisRequest({ text: 'a'.repeat(VOICE_OUTPUT_MAX_TEXT_CHARS + 1) })).toBeNull();
  });

  it('裁剪空白并透传合法 voice 与 modelId', () => {
    expect(
      normalizeVoiceOutputSynthesisRequest({ text: ' 你好 ', voice: 'female-1', modelId: ' minimax/speech-02 ' }),
    ).toEqual({
      text: '你好',
      voice: 'female-1',
      modelId: 'minimax/speech-02',
    });
  });

  it('丢弃非法 voice 与 modelId', () => {
    expect(
      normalizeVoiceOutputSynthesisRequest({ text: '你好', voice: 'x'.repeat(200), modelId: 'y'.repeat(300) }),
    ).toEqual({ text: '你好' });
  });

  it('providerId 只接受安全字符（防拼接密钥存储键）', () => {
    expect(
      normalizeVoiceOutputSynthesisRequest({ text: '你好', modelId: 'tts-1', providerId: 'my-provider_1' }),
    ).toEqual({ text: '你好', modelId: 'tts-1', providerId: 'my-provider_1' });
    expect(
      normalizeVoiceOutputSynthesisRequest({ text: '你好', modelId: 'tts-1', providerId: '../etc' }),
    ).toEqual({ text: '你好', modelId: 'tts-1' });
    expect(
      normalizeVoiceOutputSynthesisRequest({ text: '你好', modelId: 'tts-1', providerId: '' }),
    ).toEqual({ text: '你好', modelId: 'tts-1' });
  });
});
