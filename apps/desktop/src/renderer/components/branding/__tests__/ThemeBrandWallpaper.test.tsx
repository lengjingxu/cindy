// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Theme } from '@/themes/types';
import { ThemeBrandWallpaper } from '../ThemeBrandWallpaper';

afterEach(cleanup);

const theme: Theme = {
  id: 'wallpaper-local',
  name: 'Wallpaper',
  type: 'dark',
  colors: {},
  brand: { wallpaper: { src: 'wallpaper.png' } },
};

describe('ThemeBrandWallpaper', () => {
  it('renders the local asset as a static cover layer with a token scrim', () => {
    const view = render(<ThemeBrandWallpaper theme={theme} />);
    const layer = view.getByTestId('create-agent-brand-wallpaper');
    const image = layer.querySelector('img');
    const scrim = layer.children[1] as HTMLElement;

    expect(layer.className).toContain('pointer-events-none');
    expect(image?.getAttribute('src')).toBe('wallpaper.png');
    expect(image?.className).toContain('object-cover');
    expect(scrim.style.backgroundColor).toBe(
      'color-mix(in srgb, var(--surface) 72%, transparent)',
    );
  });

  it('renders supported video as a muted loop and pauses under reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: true,
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
          onchange: null,
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const videoTheme: Theme = {
      ...theme,
      brand: { wallpaper: { src: 'wallpaper.mp4', mediaType: 'video' } },
    };

    const view = render(<ThemeBrandWallpaper theme={videoTheme} />);
    const video = view.getByTestId('create-agent-brand-wallpaper').querySelector('video');

    expect(video?.getAttribute('src')).toBe('wallpaper.mp4');
    expect(video?.muted).toBe(true);
    expect(video?.loop).toBe(true);
    expect(video?.playsInline).toBe(true);
    expect(pause).toHaveBeenCalled();
  });

  it('stays absent without an asset and hides a failed asset', () => {
    const absent = render(<ThemeBrandWallpaper theme={null} />);
    expect(absent.container.innerHTML).toBe('');
    absent.unmount();

    const view = render(<ThemeBrandWallpaper theme={theme} />);
    fireEvent.error(view.getByTestId('create-agent-brand-wallpaper').querySelector('img')!);
    expect(view.container.innerHTML).toBe('');
  });
});
