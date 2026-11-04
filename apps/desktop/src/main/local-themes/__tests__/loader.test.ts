import fs from 'node:fs';
import path from 'node:path';
import { mkdtempSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nativeImage } from 'electron';

const imageMock = vi.hoisted(() => ({
  images: new Map<string, { width: number; height: number; bitmap: Uint8Array }>(),
}));

const osMock = vi.hoisted(() => ({ home: '' }));

vi.mock('node:os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:os')>();
  return {
    ...actual,
    default: { ...actual, homedir: () => osMock.home },
    homedir: () => osMock.home,
  };
});

import { loadLocalThemesSync, resetLocalThemesMigrationForTest } from '../loader';

describe('local theme loader brand wallpaper', () => {
  beforeEach(() => {
    osMock.home = realpathSync(mkdtempSync(path.join(tmpdir(), 'theme-wallpaper-home-')));
    imageMock.images.clear();
    resetLocalThemesMigrationForTest();
    vi.spyOn(nativeImage, 'createFromPath').mockImplementation((filePath: string) => {
      const image = imageMock.images.get(filePath);
      if (!image) return nativeImage.createEmpty();
      return {
        ...nativeImage.createEmpty(),
        isEmpty: () => false,
        getSize: () => ({ width: image.width, height: image.height }),
        toBitmap: () => image.bitmap,
      } as ReturnType<typeof nativeImage.createEmpty>;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads wallpaper bounds and file revision without changing user JSON', () => {
    const wallpaperPath = path.join(osMock.home, 'wallpaper.png');
    const bitmap = new Uint8Array(2 * 2 * 4);
    bitmap[(0 * 2 + 1) * 4 + 3] = 255;
    imageMock.images.set(wallpaperPath, { width: 2, height: 2, bitmap });
    fs.writeFileSync(wallpaperPath, 'wallpaper');
    const themesDir = path.join(osMock.home, '.cindy', 'themes');
    fs.mkdirSync(themesDir, { recursive: true });
    fs.writeFileSync(
      path.join(themesDir, 'wallpaper.json'),
      JSON.stringify({
        id: 'wallpaper',
        name: 'Wallpaper',
        type: 'dark',
        colors: {},
        brand: { wallpaper: wallpaperPath },
      }),
    );

    const [theme] = loadLocalThemesSync().themes;
    expect(theme?.brand).toEqual({ wallpaper: wallpaperPath });
    expect(theme?.brandBounds?.wallpaper).toEqual({
      x: 1,
      y: 0,
      width: 1,
      height: 1,
      sourceWidth: 2,
      sourceHeight: 2,
    });
    expect(theme?.brandRevisions?.wallpaper).toMatch(/^\d+:\d+(\.\d+)?$/);
  });

  it('keeps a missing wallpaper path out of revision metadata', () => {
    const themesDir = path.join(osMock.home, '.cindy', 'themes');
    fs.mkdirSync(themesDir, { recursive: true });
    fs.writeFileSync(
      path.join(themesDir, 'missing.json'),
      JSON.stringify({
        id: 'missing',
        name: 'Missing',
        type: 'light',
        colors: {},
        brand: { wallpaper: path.join(osMock.home, 'missing.png') },
      }),
    );

    const [theme] = loadLocalThemesSync().themes;
    expect(theme?.brand).toEqual({ wallpaper: path.join(osMock.home, 'missing.png') });
    expect(theme?.brandBounds).toBeUndefined();
    expect(theme?.brandRevisions).toBeUndefined();
  });
});
