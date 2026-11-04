/**
 * Cindy 语音服务的 TTS（文字转语音）客户端。
 *
 * 与语音输入（CindyVoiceSessionClient）共用同一会话入口
 * `POST /api/voice/sessions`，用 `mode: 'tts'` 申请一次性合成会话；拿到
 * websocket 之外的数据面端点 + 票据后，正文 POST 过去换回音频字节。
 *
 * 契约是「探测式」的：当前线上 voice-server 可能还没有部署 TTS 会话
 * （会以 400/404/422 拒绝未知 mode），此时返回 CLOUD_TTS_UNAVAILABLE，
 * 调用方（renderer）降级系统语音，不打断语音模式的使用。
 */

import { app } from 'electron';

import * as authManager from '../authManager.js';
import { getClientEndpoint } from '../clientEndpointsService.js';
import { outboundFetch } from '../maker-host/outbound-fetch.js';
import { ServerApiError, serverApiFetch } from '../serverApiClient.js';
import { getAppCapabilities, requireAppCapability } from '../appCapabilities.js';
import { storedCustomProviderId } from '@cindy/model-providers';
import { getProviderSecretStore, readCustomProviderKey } from '../secrets/providerSecretStore.js';
import { getCustomProvider } from '../maker-host/custom-provider-store.js';
import { effectiveXdGatewayBaseUrl } from '../model-access/effectiveEndpoint.js';
import type { VoiceOutputSynthesisResult } from '../../shared/voiceOutputIpc.js';

const TTS_SESSION_REQUEST_TIMEOUT_MS = 10_000;
const TTS_SYNTHESIS_TIMEOUT_MS = 60_000;
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

type CindyVoiceTtsSession = {
  sessionId: string;
  ticket: string;
  tts: {
    provider: string;
    /** 一次性合成端点（POST JSON 正文，回音频字节）。 */
    url: string;
    /** 期望音色；可被请求覆盖。 */
    voice?: string;
  };
};

async function createTtsSession(voice: string | undefined): Promise<CindyVoiceTtsSession> {
  const request = {
    baseUrl: () => getClientEndpoint('voiceApiBaseUrl'),
    method: 'POST',
    body: {
      mode: 'tts',
      client: 'desktop',
      clientVersion: app.getVersion(),
      ...(voice ? { voice } : {}),
    },
    timeoutMs: TTS_SESSION_REQUEST_TIMEOUT_MS,
  } as const;
  let session: CindyVoiceTtsSession;
  try {
    session = await serverApiFetch<CindyVoiceTtsSession>('/api/voice/sessions', request);
  } catch (error) {
    // 与语音输入同一套 401 语义：缓存的 access token 可能已被吊销，刷新一次重试。
    if (error instanceof ServerApiError && error.statusCode === 401) {
      if (await authManager.refresh()) {
        session = await serverApiFetch<CindyVoiceTtsSession>('/api/voice/sessions', request);
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
  if (!session.ticket || !session.sessionId || !/^https?:\/\//.test(session.tts?.url ?? '')) {
    throw new Error('Cindy voice service returned an invalid TTS session.');
  }
  return session;
}

/**
 * 云端合成入口。永远 resolve（不 throw）：失败以结构化错误码返回，让 renderer
 * 可以按码降级系统语音而不是把语音模式打断成报错。
 *
 * 链路优先级：
 * 1. 用户在设置里选定了 TTS 模型 → 按所属供应商调用 OpenAI 兼容
 *    /v1/audio/speech（xd = Cindy AI 网关；其他 id = 自定义供应商，读该
 *    供应商的 baseUrl + 本机密钥）；
 * 2. 未选定 → Cindy 语音服务内置 TTS 会话探测；
 * 3. 都不可用 → CLOUD_TTS_UNAVAILABLE，renderer 降级系统语音。
 */
export async function synthesizeSpeech(input: {
  text: string;
  voice?: string;
  modelId?: string;
  providerId?: string;
}): Promise<VoiceOutputSynthesisResult> {
  if (input.modelId) {
    return synthesizeWithProviderGateway({
      text: input.text,
      voice: input.voice,
      modelId: input.modelId,
      providerId: input.providerId ?? 'xd',
    });
  }
  return synthesizeWithCindyVoice({ text: input.text, voice: input.voice });
}

/** 每个自定义供应商的 runtime 顺序：取第一个已配置 baseUrl 的 runtime。 */
const CUSTOM_PROVIDER_RUNTIME_ORDER = ['claude-code', 'codex', 'pi'] as const;

async function resolveCustomProviderEndpoint(providerId: string): Promise<{
  baseUrl: string;
  apiKey: string;
} | null> {
  // ProviderView.id 是 runtime id（xai 有历史别名），localDb 存的是存储 id，先归一。
  const config = await getCustomProvider(storedCustomProviderId(providerId)).catch(() => null);
  if (!config) return null;
  for (const agent of CUSTOM_PROVIDER_RUNTIME_ORDER) {
    const runtime = config.runtimes[agent];
    if (!runtime?.baseUrl) continue;
    // OAuth / 无鉴权形态不在本链路支持范围（无 Bearer key 可注入）；API key 才可调。
    if (config.auth?.method === 'oauth' || config.auth?.method === 'none') return null;
    const apiKey = readCustomProviderKey(storedCustomProviderId(providerId), agent)?.trim() ?? '';
    if (!apiKey) return null;
    return { baseUrl: runtime.baseUrl, apiKey };
  }
  return null;
}

async function synthesizeWithProviderGateway(input: {
  text: string;
  voice?: string;
  modelId: string;
  providerId: string;
}): Promise<VoiceOutputSynthesisResult> {
  let baseUrl: string;
  let apiKey: string;
  if (input.providerId === 'xd') {
    if (!getAppCapabilities().canUseCindyGateway) {
      return { ok: false, code: 'NOT_LOGGED_IN', message: 'Cindy gateway is unavailable.' };
    }
    baseUrl = effectiveXdGatewayBaseUrl().trim();
    apiKey = getProviderSecretStore().get('xd')?.trim() ?? '';
    if (!baseUrl || !apiKey) {
      return { ok: false, code: 'NOT_LOGGED_IN', message: 'Cindy AI connection is not ready.' };
    }
  } else {
    // 自定义供应商（设置 → 模型供应商）：读本仓配置（localDb）+ 本机密钥（safeStorage）。
    const endpoint = await resolveCustomProviderEndpoint(input.providerId);
    if (!endpoint) {
      return {
        ok: false,
        code: 'NOT_LOGGED_IN',
        message: `Provider ${input.providerId} has no usable API-key endpoint for speech synthesis.`,
      };
    }
    baseUrl = endpoint.baseUrl;
    apiKey = endpoint.apiKey;
  }
  return synthesizeViaOpenAiCompatibleSpeech({ ...input, baseUrl, apiKey });
}

async function synthesizeViaOpenAiCompatibleSpeech(input: {
  text: string;
  voice?: string;
  modelId: string;
  providerId: string;
  baseUrl: string;
  apiKey: string;
}): Promise<VoiceOutputSynthesisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TTS_SYNTHESIS_TIMEOUT_MS);
  try {
    const url = new URL(input.baseUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return { ok: false, code: 'UPSTREAM_FAILED', message: 'Speech endpoint is invalid.' };
    }
    const response = await outboundFetch(joinUrlPath(input.baseUrl, '/v1/audio/speech'), {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: input.modelId,
        input: input.text,
        ...(input.voice ? { voice: input.voice } : {}),
        response_format: 'mp3',
      }),
    });
    if (!response.ok) {
      return {
        ok: false,
        code: 'UPSTREAM_FAILED',
        message: `Speech synthesis failed with status ${response.status}`,
      };
    }
    const mime = response.headers.get('content-type')?.split(';')[0]?.trim() ?? 'audio/mpeg';
    if (!mime.startsWith('audio/')) {
      return { ok: false, code: 'UPSTREAM_FAILED', message: 'Speech upstream returned non-audio bytes.' };
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_AUDIO_BYTES) {
      return { ok: false, code: 'UPSTREAM_FAILED', message: 'Gateway TTS audio payload is empty or oversized.' };
    }
    return {
      ok: true,
      audioBase64: Buffer.from(buffer).toString('base64'),
      mime,
      provider: input.modelId,
    };
  } catch (error) {
    const aborted = controller.signal.aborted;
    return {
      ok: false,
      code: aborted ? 'TIMEOUT' : 'UPSTREAM_FAILED',
      message: aborted ? 'Speech synthesis timed out.' : error instanceof Error ? error.message : 'Speech synthesis failed.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

function joinUrlPath(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

async function synthesizeWithCindyVoice(input: {
  text: string;
  voice?: string;
}): Promise<VoiceOutputSynthesisResult> {
  if (!getClientEndpoint('voiceApiBaseUrl')) {
    return { ok: false, code: 'REGION_UNAVAILABLE', message: 'Cindy voice service is unavailable in this region.' };
  }
  if (!getAppCapabilities().canUseCindyAccountServices) {
    return { ok: false, code: 'NOT_LOGGED_IN', message: 'Cindy account services are unavailable.' };
  }
  try {
    requireAppCapability('canUseCindyAccountServices', 'Cindy voice requires a Cindy account.');
  } catch {
    return { ok: false, code: 'NOT_LOGGED_IN', message: 'Cindy login is required for voice output.' };
  }
  let session: CindyVoiceTtsSession;
  try {
    session = await createTtsSession(input.voice);
  } catch (error) {
    if (error instanceof ServerApiError && [400, 404, 405, 422].includes(error.statusCode)) {
      // 线上 voice-server 尚未部署 TTS 会话 —— 明确降级信号，不是故障。
      return {
        ok: false,
        code: 'CLOUD_TTS_UNAVAILABLE',
        message: 'Cindy voice service does not offer TTS sessions yet.',
      };
    }
    return {
      ok: false,
      code: 'UPSTREAM_FAILED',
      message: error instanceof Error ? error.message : 'TTS session allocation failed.',
    };
  }
  const token = authManager.getAccessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TTS_SYNTHESIS_TIMEOUT_MS);
  try {
    const response = await outboundFetch(session.tts.url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${session.ticket}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: input.text, sessionId: session.sessionId }),
    });
    if (!response.ok) {
      return {
        ok: false,
        code: 'UPSTREAM_FAILED',
        message: `TTS synthesis failed with status ${response.status}`,
      };
    }
    const mime = response.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
    if (!mime.startsWith('audio/')) {
      return { ok: false, code: 'UPSTREAM_FAILED', message: 'TTS upstream returned non-audio bytes.' };
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_AUDIO_BYTES) {
      return { ok: false, code: 'UPSTREAM_FAILED', message: 'TTS audio payload is empty or oversized.' };
    }
    return {
      ok: true,
      audioBase64: Buffer.from(buffer).toString('base64'),
      mime,
      provider: session.tts.provider,
    };
  } catch (error) {
    const aborted = controller.signal.aborted;
    return {
      ok: false,
      code: aborted ? 'TIMEOUT' : 'UPSTREAM_FAILED',
      message: aborted ? 'TTS synthesis timed out.' : error instanceof Error ? error.message : 'TTS synthesis failed.',
    };
  } finally {
    clearTimeout(timeout);
  }
}
