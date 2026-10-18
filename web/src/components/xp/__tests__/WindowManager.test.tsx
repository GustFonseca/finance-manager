import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { router } from 'expo-router';
import { setTestPathname } from '@/test/render';
import { useWindowId, useWindowManager, WindowIdProvider, WindowManagerProvider } from '../WindowManager';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WindowManagerProvider>{children}</WindowManagerProvider>
);

function setup(pathname = '/unknown') {
  setTestPathname(pathname);
  return renderHook(() => useWindowManager(), { wrapper });
}

describe('WindowManager', () => {
  it('opens the window of the current route', () => {
    const { result } = setup('/goals');
    expect(result.current.openWindows).toEqual(['/goals']);
    expect(result.current.activeWindow).toBe('/goals');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not open a window for routes that are not programs', () => {
    const { result } = setup('/login');
    expect(result.current.openWindows).toEqual([]);
    expect(result.current.activeWindow).toBeUndefined();
  });

  it('keeps z-order, focus and navigation in sync', () => {
    const { result } = setup('/');
    act(() => result.current.open('/accounts'));
    act(() => result.current.open('/accounts'));
    expect(result.current.openWindows).toEqual(['/', '/accounts']);
    expect(result.current.zIndexOf('/')).toBe(1);
    expect(result.current.zIndexOf('/accounts')).toBe(2);
    expect(result.current.zIndexOf('/missing')).toBe(0);
    expect(result.current.activeWindow).toBe('/accounts');
    expect(router.navigate).toHaveBeenLastCalledWith('/accounts');

    act(() => result.current.open('/'));
    expect(result.current.zIndexOf('/')).toBe(2);
    expect(result.current.activeWindow).toBe('/');
  });

  it('does not navigate for windows that are not routes', () => {
    const { result } = setup('/unknown');
    act(() => result.current.open('dialog:about'));
    expect(result.current.activeWindow).toBe('dialog:about');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('minimizes, restores and closes windows', () => {
    const { result } = setup('/');
    act(() => result.current.open('/accounts'));

    act(() => result.current.minimize('/accounts'));
    act(() => result.current.minimize('/accounts'));
    expect(result.current.isMinimized('/accounts')).toBe(true);
    expect(result.current.activeWindow).toBe('/');

    act(() => result.current.open('/accounts'));
    expect(result.current.isMinimized('/accounts')).toBe(false);

    act(() => result.current.minimize('/accounts'));
    act(() => result.current.close('/accounts'));
    expect(result.current.isOpen('/accounts')).toBe(false);
    expect(result.current.isMinimized('/accounts')).toBe(false);
    expect(result.current.zIndexOf('/accounts')).toBe(0);
  });

  it('toggles maximize', () => {
    const { result } = setup('/');
    act(() => result.current.toggleMaximize('/'));
    expect(result.current.isMaximized('/')).toBe(true);
    act(() => result.current.toggleMaximize('/'));
    expect(result.current.isMaximized('/')).toBe(false);
  });

  it('minimizes the active window from the taskbar and restores the others', () => {
    const { result } = setup('/');
    act(() => result.current.open('/accounts'));

    act(() => result.current.toggleFromTaskbar('/accounts'));
    expect(result.current.isMinimized('/accounts')).toBe(true);

    act(() => result.current.toggleFromTaskbar('/accounts'));
    expect(result.current.isMinimized('/accounts')).toBe(false);
    expect(result.current.activeWindow).toBe('/accounts');

    act(() => result.current.toggleFromTaskbar('/'));
    expect(result.current.activeWindow).toBe('/');
  });

  it('stores positions and metadata', () => {
    const { result } = setup('/');
    expect(result.current.positionOf('/')).toBeUndefined();
    act(() => result.current.setPosition('/', { x: 5, y: 6 }));
    expect(result.current.positionOf('/')).toEqual({ x: 5, y: 6 });

    expect(result.current.metaOf('/')).toBeUndefined();
    act(() => result.current.setMeta('/', { title: 'Painel', icon: 'line-chart' }));
    const before = result.current;
    act(() => result.current.setMeta('/', { title: 'Painel', icon: 'line-chart' }));
    expect(result.current).toBe(before);
    act(() => result.current.setMeta('/', { title: 'Painel', icon: 'bank' }));
    expect(result.current.metaOf('/')).toEqual({ title: 'Painel', icon: 'bank' });
    act(() => result.current.setMeta('/', { title: 'Outro', icon: 'bank' }));
    expect(result.current.metaOf('/')).toEqual({ title: 'Outro', icon: 'bank' });
  });

  it('requires its providers', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useWindowManager())).toThrow(
      'useWindowManager must be used within a WindowManagerProvider'
    );
    expect(() => renderHook(() => useWindowId())).toThrow('useWindowId must be used within a WindowIdProvider');
    jest.restoreAllMocks();
  });

  it('exposes the window id', () => {
    const { result } = renderHook(() => useWindowId(), {
      wrapper: ({ children }) => <WindowIdProvider value="/goals">{children}</WindowIdProvider>,
    });
    expect(result.current).toBe('/goals');
  });
});
