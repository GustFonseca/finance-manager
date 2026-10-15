import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Href, usePathname, useRouter } from 'expo-router';
import { findProgram } from './programs';
import type { Point } from './useWindowDrag';

type WindowManagerApi = {
  /** Open windows, in the order they appear on the taskbar. */
  openRoutes: string[];
  /** The focused window: topmost one that isn't minimized. */
  activeRoute: string | undefined;
  /** Stacking order for the window frame (higher = in front). */
  zIndexOf: (route: string) => number;
  isOpen: (route: string) => boolean;
  isMinimized: (route: string) => boolean;
  isMaximized: (route: string) => boolean;
  /** Opens the window if needed, restores it and brings it to the front. */
  open: (route: string) => void;
  close: (route: string) => void;
  minimize: (route: string) => void;
  toggleMaximize: (route: string) => void;
  /** Taskbar click: focus the window, or minimize it if it's already focused. */
  toggleFromTaskbar: (route: string) => void;
  /** Where the user dragged the restored window; undefined = default cascade. */
  positionOf: (route: string) => Point | undefined;
  setPosition: (route: string, point: Point) => void;
};

const WindowManagerContext = createContext<WindowManagerApi | null>(null);

const without = (list: string[], route: string) => list.filter((r) => r !== route);

/**
 * XP-style window state: several program windows open at once, stacked in
 * z-order. The focused window and the URL are kept in sync, so links, reloads
 * and the back button still work.
 */
export function WindowManagerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [openRoutes, setOpenRoutes] = useState<string[]>([]);
  /** Back-to-front stacking order of the open windows. */
  const [zOrder, setZOrder] = useState<string[]>([]);
  const [minimized, setMinimized] = useState<string[]>([]);
  const [maximized, setMaximized] = useState<string[]>([]);
  const [positions, setPositions] = useState<Record<string, Point>>({});

  const activeRoute = [...zOrder].reverse().find((r) => !minimized.includes(r));

  const open = useCallback((route: string) => {
    setOpenRoutes((prev) => (prev.includes(route) ? prev : [...prev, route]));
    setZOrder((prev) => [...without(prev, route), route]);
    setMinimized((prev) => without(prev, route));
  }, []);

  // Arriving at a program's URL (link, reload, back button) focuses its window…
  useEffect(() => {
    if (findProgram(pathname)) open(pathname);
  }, [pathname, open]);

  // …and focusing a window moves the URL to it.
  useEffect(() => {
    if (activeRoute && activeRoute !== pathname) router.navigate(activeRoute as Href);
    // `pathname` is left out on purpose: only a focus change should navigate.
  }, [activeRoute, router]);

  const close = useCallback((route: string) => {
    setOpenRoutes((prev) => without(prev, route));
    setZOrder((prev) => without(prev, route));
    setMinimized((prev) => without(prev, route));
  }, []);

  const minimize = useCallback((route: string) => {
    setMinimized((prev) => (prev.includes(route) ? prev : [...prev, route]));
  }, []);

  const toggleMaximize = useCallback((route: string) => {
    setMaximized((prev) => (prev.includes(route) ? without(prev, route) : [...prev, route]));
  }, []);

  const setPosition = useCallback((route: string, point: Point) => {
    setPositions((prev) => ({ ...prev, [route]: point }));
  }, []);

  const api = useMemo<WindowManagerApi>(
    () => ({
      openRoutes,
      activeRoute,
      zIndexOf: (route) => zOrder.indexOf(route) + 1,
      isOpen: (route) => openRoutes.includes(route),
      isMinimized: (route) => minimized.includes(route),
      isMaximized: (route) => maximized.includes(route),
      open,
      close,
      minimize,
      toggleMaximize,
      toggleFromTaskbar: (route) => (route === activeRoute ? minimize(route) : open(route)),
      positionOf: (route) => positions[route],
      setPosition,
    }),
    [
      openRoutes,
      activeRoute,
      zOrder,
      minimized,
      maximized,
      positions,
      open,
      close,
      minimize,
      toggleMaximize,
      setPosition,
    ]
  );

  return <WindowManagerContext.Provider value={api}>{children}</WindowManagerContext.Provider>;
}

export function useWindowManager(): WindowManagerApi {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error('useWindowManager must be used within a WindowManagerProvider');
  return ctx;
}

const WindowRouteContext = createContext<string | null>(null);

/** Tells a program's `<Window>` which window (route) it is. */
export const WindowRouteProvider = WindowRouteContext.Provider;

export function useWindowRoute(): string {
  const route = useContext(WindowRouteContext);
  if (route === null) throw new Error('useWindowRoute must be used within a WindowRouteProvider');
  return route;
}
