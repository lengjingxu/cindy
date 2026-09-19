import fs from 'node:fs';
import os from 'node:os';

import {
  peekHostMediaModel,
  runHostImageEdit,
  runHostImageGenerate,
  runHostImageToVideo,
} from '../cindy-brain/index.js';

function debugPeekDetail(): Record<string, string | null> {
  const detail: Record<string, string | null> = {};
  const capabilities = ['image.generate', 'image.edit', 'video.edit'] as const;
  for (const capability of capabilities) {
    try {
      detail[capability] = peekHostMediaModel(capability)?.label ?? null;
    } catch (error) {
      detail[capability] = 'ERR:' + String(error).slice(0, 300);
    }
  }
  try {
    fs.writeFileSync(os.tmpdir() + '/dc-peek-debug.json', JSON.stringify(detail, null, 2));
  } catch {
    // diagnostics only
  }
  return detail;
}

export function peekDesktopCompanionMedia(): { image: boolean; video: boolean } {
  const detail = debugPeekDetail();
  return {
    image: detail['image.generate'] !== null || detail['image.edit'] !== null,
    video: detail['video.edit'] !== null,
  };
}

export function generateDesktopCompanionStill(params: {
  prompt: string;
  refPath: string | null;
}): Promise<{ buffer: Buffer; mimeType: string }> {
  if (params.refPath) {
    return runHostImageEdit({
      prompt: params.prompt,
      imagePaths: [params.refPath],
      aspectRatio: '3:2',
    }).catch(() => runHostImageGenerate({ prompt: params.prompt, aspectRatio: '3:2' }));
  }
  return runHostImageGenerate({ prompt: params.prompt, aspectRatio: '3:2' });
}

export function generateDesktopCompanionVideo(params: {
  prompt: string;
  stillPath: string;
}): Promise<{ buffer: Buffer; mimeType: string }> {
  return runHostImageToVideo({
    prompt: params.prompt,
    imagePaths: [params.stillPath],
    ratio: '16:9',
    duration: 6,
    audio: false,
  });
}
