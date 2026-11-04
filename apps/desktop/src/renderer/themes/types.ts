import type { ImageVisibleBounds } from '../../shared/imageVisibleBounds';

export type ColorIdentifier = string;
export type ColorValue = string;
export type ThemeType = 'light' | 'dark';

export interface ColorDefaults {
  light: ColorValue | null;
  dark: ColorValue | null;
}

export interface ColorContribution {
  id: ColorIdentifier;
  defaults: ColorDefaults;
  description: string;
}

export interface ThemeBrandAsset {
  /** 可直接用于图片或视频元素的打包 URL 或 xdt-file URL。 */
  src: string;
  /** local loader 计算出的透明边距裁切范围。 */
  visibleBounds?: ImageVisibleBounds;
  /** 仅壁纸使用；缺省视为静态图片。 */
  mediaType?: 'image' | 'video';
}

export interface ThemeBrand {
  icon?: ThemeBrandAsset;
  logo?: ThemeBrandAsset;
  /** 新建对话页品牌画布壁纸；仅本地主题经 loader 提供。 */
  wallpaper?: ThemeBrandAsset;
}

export interface Theme {
  id: string;
  name: string;
  type: ThemeType;
  /**
   * 仅本地主题使用的家族键（见 shared/local-themes.ts）。同 family 的 light +
   * dark 会在设置里合并成一个可跟随模式切换的主题；缺省则各自成家族。
   */
  family?: string;
  colors: Partial<Record<ColorIdentifier, ColorValue>>;
  /** 新建对话页的方形 icon + 横向 logo；两项缺省时分别回退打包默认素材。 */
  brand?: ThemeBrand;
}
