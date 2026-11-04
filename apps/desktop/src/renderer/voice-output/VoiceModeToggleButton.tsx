/**
 * VoiceModeToggleButton — 聊天输入框的「语音模式」开关。
 *
 * 语音模式 = 伙伴回复自动朗读（视觉：Volume2 / VolumeX，激活态与录音态同极性
 * chip 填充）。按钮与语音输入按钮同风格常驻外框（30px 圆形 pill，composer
 * token），放语音输入按钮左侧，构成「语音输入 → 语音回复」的一组入口。
 * Icon-only 控件契约（DESIGN.md §14.6）：aria-label + Tip 随状态一起变，
 * 描述下一步动作。
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';

import { Tip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { stopSpeaking } from './speechPlayer';
import { setVoiceModeEnabled, useVoiceModeEnabled } from './voiceModePreference';

export const VoiceModeToggleButton = memo(function VoiceModeToggleButton(props: {
  disabled?: boolean;
  className?: string;
  /** 播放中给图标加呼吸动画，提示「正在朗读」。 */
  speaking?: boolean;
}) {
  const { disabled = false, className, speaking = false } = props;
  const { t } = useTranslation();
  const enabled = useVoiceModeEnabled();
  const label = enabled
    ? t('newChat.chatInput.voiceMode.turnOff')
    : t('newChat.chatInput.voiceMode.turnOn');
  const Icon = enabled ? Volume2 : VolumeX;

  return (
    <Tip text={label} side="top">
      <button
        type="button"
        aria-label={label}
        aria-pressed={enabled}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (enabled) stopSpeaking();
          setVoiceModeEnabled(!enabled);
        }}
        className={cn(
          'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full p-0',
          'bg-[var(--composer-pill-bg,#FCFCFC)] dark:bg-[var(--composer-pill-bg,#393838)] border border-[var(--border-default)] text-[var(--composer-pill-icon,#3C3F43)] dark:text-[var(--composer-pill-icon,#D9D9D9)]',
          'hover:bg-[var(--model-trigger-hover)]',
          enabled && 'bg-[var(--surface-chip)] text-[var(--text-primary)] hover:bg-[var(--surface-chip)]',
          'focus-visible:outline-none',
          disabled && 'cursor-not-allowed opacity-40',
          className,
        )}
      >
        <span className={cn('flex h-[28px] w-[28px] items-center justify-center', speaking && 'animate-pulse motion-reduce:animate-none')}>
          <Icon size={15} />
        </span>
      </button>
    </Tip>
  );
});
