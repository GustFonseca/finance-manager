import React from 'react';
import { act, render, renderHook, screen, fireEvent } from '@testing-library/react';
import { playClick } from '../sound/clickSound';
import { SoundProvider, useSound } from '../sound/SoundProvider';

jest.mock('../sound/clickSound', () => ({ playClick: jest.fn() }));

const STORAGE_KEY = 'xp_sound';

const wrapper = ({ children }: { children: React.ReactNode }) => <SoundProvider>{children}</SoundProvider>;

async function setup() {
  const utils = renderHook(() => useSound(), { wrapper });
  await act(async () => {});
  return utils;
}

describe('SoundProvider', () => {
  it('starts with the default volume and saves it', async () => {
    const { result } = await setup();
    expect(result.current.volume).toBe(60);
    expect(result.current.muted).toBe(false);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toEqual({ volume: 60, muted: false });
  });

  it('restores the saved settings', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: 25, muted: true }));
    const { result } = await setup();
    expect(result.current.volume).toBe(25);
    expect(result.current.muted).toBe(true);
  });

  it('ignores saved values of the wrong type', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: 'alto', muted: 'sim' }));
    const { result } = await setup();
    expect(result.current.volume).toBe(60);
    expect(result.current.muted).toBe(false);
  });

  it('falls back to the defaults when the saved settings are corrupt', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken');
    const { result } = await setup();
    expect(result.current.volume).toBe(60);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toEqual({ volume: 60, muted: false });
  });

  it('plays the click at a level based on the volume', async () => {
    const { result } = await setup();
    act(() => result.current.click());
    expect(playClick).toHaveBeenLastCalledWith(0.6 ** 2 * 0.8);

    act(() => result.current.setVolume(100));
    act(() => result.current.click());
    expect(playClick).toHaveBeenLastCalledWith(0.8);

    act(() => result.current.setMuted(true));
    act(() => result.current.click());
    expect(playClick).toHaveBeenLastCalledWith(0);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toEqual({ volume: 100, muted: true });
  });

  it('clicks when a clickable element is clicked anywhere in the page', async () => {
    render(
      <SoundProvider>
        <div role="button">botão</div>
        <div tabIndex={0}>foco</div>
        <p>texto</p>
      </SoundProvider>
    );
    await act(async () => {});

    fireEvent.click(screen.getByText('botão'));
    expect(playClick).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('foco'));
    expect(playClick).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByText('texto'));
    expect(playClick).toHaveBeenCalledTimes(2);
  });

  it('requires the provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useSound())).toThrow('useSound must be used within a SoundProvider');
    jest.restoreAllMocks();
  });
});
