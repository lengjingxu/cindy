/**
 * VoiceOutputSection — 设置 → 语音输入 tab 里的「语音朗读」区块。
 *
 * 语音模式开关在聊天输入框（快捷触达）；这里配置的是「伙伴说话用哪个声音」：
 * 默认自动（Cindy 语音服务内置 TTS，不可用时降级系统语音）；Cindy 尚未提供
 * 默认 TTS 时，从模型目录的 tts 分类里选定一个模型，云端合成改走 XD 网关
 * /v1/audio/speech。
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Volume2 } from 'lucide-react';

import { classifyModel } from '@cindy/model-providers';
import type { ProviderView } from '@cindy/model-providers';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProviders } from '@/hooks/useProviders';
import { cn } from '@/lib/utils';
import { setVoiceTtsModel, useVoiceTtsModel, type VoiceTtsModelChoice } from '@/voice-output/voiceModePreference';

const AUTOMATIC_VALUE = '';

/** 下拉选项 value 的分段符（model id 不会含 \u0000，拼接后可逆）。 */
const OPTION_VALUE_SEP = '\u0000';

function optionValue(choice: VoiceTtsModelChoice): string {
  return `${choice.providerId}${OPTION_VALUE_SEP}${choice.modelId}`;
}

function parseOptionValue(value: string): VoiceTtsModelChoice | null {
  const sepIdx = value.indexOf(OPTION_VALUE_SEP);
  if (sepIdx <= 0) return null;
  const providerId = value.slice(0, sepIdx);
  const modelId = value.slice(sepIdx + 1);
  return providerId && modelId ? { providerId, modelId } : null;
}

type TtsModelOption = VoiceTtsModelChoice & { label: string; providerName: string };

function collectTtsModels(providers: readonly ProviderView[]): TtsModelOption[] {
  const out: TtsModelOption[] = [];
  const seen = new Set<string>();
  for (const provider of providers) {
    // 只列已连接、未停用的供应商（xd = Cindy AI 网关；source==='user' = 自定义供应商）。
    if (!provider.connected || provider.suspended) continue;
    const providerName = provider.id === 'xd' ? 'Cindy AI' : provider.name || provider.id;
    for (const agent of ['claude-code', 'codex', 'pi'] as const) {
      for (const model of provider.models[agent] ?? []) {
        const key = optionValue({ providerId: provider.id, modelId: model.id });
        if (seen.has(key)) continue;
        seen.add(key);
        if (classifyModel(model) !== 'tts') continue;
        out.push({
          providerId: provider.id,
          modelId: model.id,
          label: model.name || model.id,
          providerName,
        });
      }
    }
  }
  return out;
}

export function VoiceOutputSection() {
  const { t } = useTranslation();
  const { providers } = useProviders();
  const selectedModel = useVoiceTtsModel();
  const [open, setOpen] = useState(false);

  const ttsModels = useMemo(() => collectTtsModels(providers), [providers]);
  const anySpeechProviderReady = useMemo(
    () => providers.some((p) => p.connected && !p.suspended),
    [providers],
  );

  const options = useMemo(
    () => [
      { value: AUTOMATIC_VALUE, label: t('settings.voiceOutput.model.automatic') },
      ...ttsModels.map((m) => ({
        value: optionValue(m),
        label: m.label,
        providerName: m.providerName,
      })),
    ],
    [ttsModels, t],
  );
  const selectedValue = selectedModel ? optionValue(selectedModel) : AUTOMATIC_VALUE;
  const selectedLabel =
    options.find((o) => o.value === selectedValue)?.label ?? t('settings.voiceOutput.model.automatic');

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex flex-col gap-1">
        <h2 className="text-16 font-medium leading-[1.2] text-[var(--settings-section-title)]">
          {t('settings.voiceOutput.title')}
        </h2>
        <p className="text-13 leading-[1.5] text-[var(--settings-section-desc)]">
          {t('settings.voiceOutput.description')}
        </p>
      </div>

      <div className="flex flex-col gap-[14px] rounded-xl border border-[var(--settings-theme-card-border)] bg-[var(--settings-theme-card-bg)] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-14 font-medium leading-none text-[var(--text-primary)]">
            <Volume2 size={15} className="text-[var(--settings-section-sublabel)]" />
            {t('settings.voiceOutput.model.label')}
          </p>
        </div>
        <p className="text-12 leading-[1.5] text-[var(--text-secondary)]">
          {anySpeechProviderReady
            ? t('settings.voiceOutput.model.description')
            : t('settings.voiceOutput.model.gatewayOffline')}
        </p>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t('settings.voiceOutput.model.ariaLabel')}
              aria-haspopup="listbox"
              aria-expanded={open}
              className={cn(
                'group flex min-h-[44px] w-full items-center justify-between gap-2.5 rounded-[14px] px-3.5',
                'border border-[var(--settings-input-border)] bg-[var(--settings-input-bg)]',
                'text-left text-[var(--settings-input-text)] shadow-[var(--shadow-menu)]',
                'outline-none transition-colors',
                open
                  ? 'border-[var(--settings-section-title)]'
                  : 'hover:border-[var(--settings-input-border-focus)] focus-visible:border-[var(--settings-input-border-focus)]',
              )}
            >
              <span className="truncate py-1.5 text-14 font-medium leading-[1.25]">{selectedLabel}</span>
              <ChevronDown
                size={18}
                className={cn(
                  'shrink-0 text-[var(--settings-section-title)] transition-transform',
                  open && 'rotate-180',
                )}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={8}
            collisionPadding={12}
            className={cn(
              'w-[var(--radix-popover-trigger-width)] min-w-[260px] rounded-[16px] p-2',
              'border border-[var(--settings-theme-card-border)] bg-[var(--settings-theme-card-bg)]',
              'shadow-[var(--shadow-menu)]',
              'max-h-[360px] overflow-y-auto',
            )}
          >
            <div className="flex flex-col gap-1" role="listbox" aria-label={t('settings.voiceOutput.model.ariaLabel')}>
              {options.map((option) => {
                const selected = option.value === selectedValue;
                return (
                  <button
                    key={option.value || '__auto__'}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setVoiceTtsModel(parseOptionValue(option.value));
                      setOpen(false);
                    }}
                    className={cn(
                      'flex min-h-[36px] items-center justify-between gap-2 rounded-[10px] px-3 py-1.5 text-left',
                      'text-14 leading-[1.35] text-[var(--settings-input-text)]',
                      'hover:bg-[var(--settings-row-hover)]',
                      selected && 'bg-[var(--surface-chip)]',
                    )}
                  >
                    <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate">{option.label}</span>
                      {'providerName' in option && option.providerName ? (
                        <span className="shrink-0 text-11 text-[var(--text-secondary)]">{option.providerName}</span>
                      ) : null}
                    </span>
                    {selected ? (
                      <Check size={15} className="shrink-0 text-[var(--settings-section-title)]" />
                    ) : null}
                  </button>
                );
              })}
              {ttsModels.length === 0 ? (
                <p className="px-3 py-2 text-12 leading-[1.5] text-[var(--text-secondary)]">
                  {t('settings.voiceOutput.model.empty')}
                </p>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
