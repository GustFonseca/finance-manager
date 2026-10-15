import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getItem, setItem } from '@/lib/storage';
import { playClick } from './clickSound';

const STORAGE_KEY = 'xp_sound';
const DEFAULT_VOLUME = 60;

/** Elements whose clicks make the sound: buttons, menu items, radios, icons. */
const CLICKABLE =
  '[role="button"], [role="radio"], [role="menuitem"], [tabindex="0"], select, input[type="checkbox"]';

type SoundApi = {
  /** 0–100, as on the XP volume slider. */
  volume: number;
  muted: boolean;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  /** Plays the click now, at the current volume (used for the slider preview). */
  click: () => void;
};

const SoundContext = createContext<SoundApi | null>(null);

/** Perceived loudness is roughly logarithmic, so square the slider value. */
const level = (volume: number, muted: boolean) => (muted ? 0 : (volume / 100) ** 2 * 0.8);

/**
 * Plays the XP click on every interactive element of the desktop and owns the
 * volume / mute settings (saved per browser).
 */
export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getItem(STORAGE_KEY).then((saved) => {
      if (saved) {
        const parsed = JSON.parse(saved) as { volume?: number; muted?: boolean };
        if (typeof parsed.volume === 'number') setVolume(parsed.volume);
        if (typeof parsed.muted === 'boolean') setMuted(parsed.muted);
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    // Don't overwrite the saved settings with the defaults before they load.
    if (loaded) setItem(STORAGE_KEY, JSON.stringify({ volume, muted }));
  }, [loaded, volume, muted]);

  // One listener for the whole desktop instead of wiring every component.
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
