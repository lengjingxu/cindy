import { useCallback, useEffect, useState } from 'react';

import type { DesktopCompanionSnapshot } from '../../shared/desktopCompanion';

const EMPTY: DesktopCompanionSnapshot = {
  supported: false,
  enabled: false,
  locationEnabled: false,
  status: 'idle',
  lastTopic: null,
  lastUpdatedAt: null,
  lastError: null,
  previewSrc: null,
  imageReady: false,
  videoReady: false,
};

export function useDesktopCompanionSettings(): {
  snapshot: DesktopCompanionSnapshot;
  setEnabled: (enabled: boolean) => Promise<void>;
  setLocationEnabled: (enabled: boolean) => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [snapshot, setSnapshot] = useState<DesktopCompanionSnapshot>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    void window.electronAPI.desktopCompanion.getState().then((next) => {
      if (!cancelled) setSnapshot(next);
    });
    const unsubscribe = window.electronAPI.desktopCompanion.onState((next) => setSnapshot(next));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const setEnabled = useCallback(async (enabled: boolean) => {
    setSnapshot(await window.electronAPI.desktopCompanion.setEnabled(enabled));
  }, []);

  const setLocationEnabled = useCallback(async (enabled: boolean) => {
    setSnapshot(await window.electronAPI.desktopCompanion.setLocationEnabled(enabled));
  }, []);

  const refresh = useCallback(async () => {
    setSnapshot(await window.electronAPI.desktopCompanion.refresh());
  }, []);

  return { snapshot, setEnabled, setLocationEnabled, refresh };
}
