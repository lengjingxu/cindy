import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { PassportState } from '../../../shared/passport';

export function PassportSettings({ onBack }: { onBack(): void }) {
  const { t } = useTranslation();
  const [state, setState] = useState<PassportState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const api = window.electronAPI.passport;
  useEffect(() => {
    let disposed = false;
    const refresh = async () => {
      try { const next = await api.getState(); if (!disposed) setState(next); }
      catch { if (!disposed) setError(true); }
    };
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 1000);
    return () => { disposed = true; clearInterval(timer); };
  }, [api]);
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError(false);
    try { await action(); setState(await api.getState()); }
    catch { setError(true); }
    finally { setBusy(false); }
  };
  return <div className="flex flex-col gap-4 text-13 text-[var(--text-primary)]">
    <div className="flex items-center gap-3">
      <Button onClick={onBack}>{t('settings.passport.back')}</Button>
      <h2 className="text-16 font-medium">Cindy Passport</h2>
    </div>
    <p className="text-[var(--text-secondary)]">{t('settings.passport.description')}</p>
    <label className="flex items-center justify-between gap-3">
      {t('settings.passport.enabled')}
      <Switch checked={state?.enabled ?? false} disabled={busy || !state?.supported}
        onCheckedChange={(enabled) => { void run(() => api.setEnabled(enabled)); }} />
    </label>
    {state && <p role="status">{t(`settings.passport.${!state.supported ? 'unsupported' : !state.enabled ? 'disabled' : state.connected ? 'connected' : state.bluetooth === 5 ? 'scanning' : 'bluetooth'}`)}</p>}
    {state?.enabled && <>
      {state.devices.map((id) => <Button key={id} disabled={busy} onClick={() => { void run(() => api.connect(id)); }}>
        {t('settings.passport.connect')} · {id.slice(0, 8)}
      </Button>)}
      <Button disabled={busy} onClick={() => { void run(() => api.disconnect()); }}>{t('settings.passport.disconnect')}</Button>
      <p role="status" className="text-[var(--text-secondary)]">{t(`settings.passport.voice.${state.voice}`)}</p>
    </>}
    <Button disabled={busy || !state?.supported} onClick={() => { void run(() => api.setEnabled(null)); }}>{t('settings.passport.reset')}</Button>
    {error && <p role="alert" className="text-[var(--error-fg)]">{t('settings.passport.error')}</p>}
  </div>;
}
