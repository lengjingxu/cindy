import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { DEFAULT_DESKTOP_COMPANION_SETTINGS } from '../../../shared/desktopCompanion.js';
import { DesktopCompanionService, materializeToApplyDir } from '../service.js';
import { normalizePersistedState, type DesktopCompanionPersistedState } from '../store.js';

function emptyState(): DesktopCompanionPersistedState {
  return normalizePersistedState({ settings: { ...DEFAULT_DESKTOP_COMPANION_SETTINGS, enabled: true } });
}

describe('desktop companion service', () => {
  it('reuses a still when idle and the pool is still valid', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'cindy-desktop-companion-'));
    const stillPath = path.join(dir, 'still.jpg');
    writeFileSync(stillPath, 'still');
    let state = emptyState();
    state.reusePool = [
      {
        fingerprint: 'night||companion|',
        stillPath,
        videoPath: null,
        topic: 'idle night',
        expiresAt: Date.now() + 60_000,
      },
    ];
    const wallpapers: string[] = [];
    const service = new DesktopCompanionService({
      now: () => Date.now(),
      isMac: () => true,
      shouldReduceMotion: () => true,
      readState: () => state,
      writeState: (next) => {
        state = next;
      },
      applyDir: () => dir,
      characterRefPath: () => null,
      collectContext: async () => ({ taskTitle: null, memoryTopics: [], city: null }),
      peekMedia: () => ({ image: true, video: false }),
      generateStill: async () => {
        throw new Error('should reuse');
      },
      generateVideo: async () => {
        throw new Error('no video');
      },
      materialize: (media, kind) => materializeToApplyDir(dir, media, kind),
      setWallpaper: async (filePath) => {
        wallpapers.push(filePath);
      },
      playVideo: async () => undefined,
      stopVideo: async () => undefined,
      toPreviewSrc: (filePath) => filePath,
    });

    await service.refresh();
    expect(wallpapers).toEqual([stillPath]);
    expect(state.lastStillPath).toBe(stillPath);
    expect(service.snapshot().status).toBe('ready');
  });

  it('records NO_IMAGE_MODEL when no image channel is ready', async () => {
    let state = emptyState();
    const service = new DesktopCompanionService({
      now: () => Date.now(),
      isMac: () => true,
      shouldReduceMotion: () => false,
      readState: () => state,
      writeState: (next) => {
        state = next;
      },
      applyDir: () => '/tmp',
      characterRefPath: () => null,
      collectContext: async () => ({ taskTitle: 'x', memoryTopics: [], city: null }),
      peekMedia: () => ({ image: false, video: false }),
      generateStill: async () => {
        throw new Error('no');
      },
      generateVideo: async () => {
        throw new Error('no');
      },
      materialize: () => '/tmp/x.jpg',
      setWallpaper: async () => undefined,
      playVideo: async () => undefined,
      stopVideo: async () => undefined,
      toPreviewSrc: () => null,
    });

    await service.refresh();
    expect(state.lastError).toBe('NO_IMAGE_MODEL');
    expect(service.snapshot().status).toBe('idle');
  });
});
