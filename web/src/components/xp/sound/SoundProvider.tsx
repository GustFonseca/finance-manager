import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getItem, setItem } from '@/lib/storage';
import { playClick } from './clickSound';

const STORAGE_KEY = 'xp_sound';
const DEFAULT_VOLUME = 60;

const CLICKABLE =
  '[role="button"], [role="radio"], [role="menuitem"], [tabindex="0"], select, input[type="checkbox"]';

type SoundApi = {
  volume: number;
  muted: boolean;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  click: () => void;
};

const SoundContext = createContext<SoundApi | null>(null);

const level = (volume: number, muted: boolean) => (muted ? 0 : (volume / 100) ** 2 * 0.8);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getItem(STORAGE_KEY).then((saved) => {
      try {
        if (saved) {
          const parsed = JSON.parse(saved) as { volume?: number; muted?: boolean };
          if (typeof parsed.volume === 'number') setVolume(parsed.volume);
          if (typeof parsed.muted === 'boolean') setMuted(parsed.muted);
        }
      } catch {
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) setItem(STORAGE_KEY, JSON.stringify({ volume, muted }));
  }, [loaded, volume, muted]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(CLICKABLE)) playClick(level(volume, muted));
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [volume, muted]);

  const click = useCallback(() => playClick(level(volume, muted)), [volume, muted]);

  const api = useMemo(
    () => ({ volume, muted, setVolume, setMuted, click }),
    [volume, muted, click]
  );

  return <SoundContext.Provider value={api}>{children}</SoundContext.Provider>;
}

export function useSound(): SoundApi {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used within a SoundProvider');
  return ctx;
}
