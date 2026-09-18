import fs from 'node:fs/promises';
import path from 'node:path';

import { decodeImageResponse } from '../cindy-brain/imageChannelRegistry.js';
import { getCindyProxyMediaService } from '../mcp-integrations/cindyProxyMedia.js';
import { GATEWAY_IMAGE_MODELS, GATEWAY_VIDEO_MODELS } from '../cindy-proxy-media/types.js';
import { submitAndAwaitVideo } from '../cindy-proxy-media/video/run.js';

const IMAGE_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export function peekDesktopCompanionMedia(): { image: boolean; video: boolean } {
  try {
    const backend = getCindyProxyMediaService().backend;
    return {
      image: Boolean(backend.generateImage),
      video: Boolean(backend.videoRegistry?.hasAny()),
    };
  } catch {
    return { image: false, video: false };
  }
}

export async function generateDesktopCompanionStill(params: {
  prompt: string;
  refPath: string | null;
}): Promise<{ buffer: Buffer; mimeType: string }> {
  const backend = getCindyProxyMediaService().backend;
  const model = GATEWAY_IMAGE_MODELS[0].id;
  if (params.refPath) {
    try {
      const edited = await backend.editImage({
        model,
        prompt: params.prompt,
        imagePaths: [params.refPath],
        size: '1536x1024',
      });
      return decodeImageResponse(edited);
    } catch {
      // 当前出图通道不接受参考图时，改走文生图，身份锁仍写在 prompt 里。
    }
  }
  const generated = await backend.generateImage({
    model,
    prompt: params.prompt,
    size: '1536x1024',
  });
  return decodeImageResponse(generated);
}

export async function generateDesktopCompanionVideo(params: {
  prompt: string;
  stillPath: string;
}): Promise<{ buffer: Buffer; mimeType: string }> {
  const registry = getCindyProxyMediaService().backend.videoRegistry;
  if (!registry?.hasAny()) throw new Error('NO_VIDEO_MODEL');
  const alias =
    GATEWAY_VIDEO_MODELS.map((model) => model.id).find((id) => registry.hasAlias(id)) ??
    registry.collectAllAliases()[0]?.alias;
  if (!alias) throw new Error('NO_VIDEO_MODEL');
  const imageDataUris = [await readImageDataUri(params.stillPath)];
  const generated = await submitAndAwaitVideo(registry, {
    alias,
    prompt: params.prompt,
    imageDataUris,
    refMode: 'first_and_last_frame',
    ratio: '16:9',
    duration: 6,
  });
  return { buffer: generated.buffer, mimeType: generated.mimeType };
}

async function readImageDataUri(filePath: string): Promise<string> {
  const mime = IMAGE_MIME[path.extname(filePath).toLowerCase()];
  if (!mime) throw new Error('unsupported still image type');
  const bytes = await fs.readFile(filePath);
  return 'data:' + mime + ';base64,' + bytes.toString('base64');
}
