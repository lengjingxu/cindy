import { useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Theme } from '@/themes/types';

/**
 * ThemeBrandWallpaper — 本地主题专属的新建对话页壁纸层。
 *
 * 壁纸只作为品牌画布铺底，不进入工作 UI；语义 token 遮罩保证 Light/Dark
 * 下的前景可读性。视频由用户素材驱动，静音循环；缺省或加载失败都完全退场。
*/
export function ThemeBrandWallpaper({ theme }: { theme: Theme | null }) {
  const wallpaper = theme?.brand?.wallpaper;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      if (typeof video.pause === 'function') video.pause();
      return;
    }
    const playback = typeof video.play === 'function' ? video.play() : undefined;
    playback?.catch(() => {});
  }, [reducedMotion, wallpaper?.src]);

  if (!wallpaper || failedSrc === wallpaper.src) return null;

  return (
    <div
      aria-hidden
      data-testid="create-agent-brand-wallpaper"
      className="theme-brand-wallpaper pointer-events-none absolute inset-0 z-0"
    >
      {wallpaper.mediaType === 'video' ? (
        <video
          ref={videoRef}
          src={wallpaper.src}
          autoPlay={!reducedMotion}
          className="h-full w-full select-none object-cover"
          loop
          muted
          playsInline
          preload="metadata"
          onError={() => setFailedSrc(wallpaper.src)}
        />
      ) : (
        <img
          src={wallpaper.src}
          alt=""
          className="h-full w-full select-none object-cover"
          onError={() => setFailedSrc(wallpaper.src)}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--surface) 72%, transparent)',
        }}
      />
    </div>
  );
}
