import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Href, usePathname, useRouter } from 'expo-router';
import { findProgram } from './programs';
import type { IconName } from './TitleBar';
import type { Point } from './useWindowDrag';

/** What the taskbar shows for a window; registered by the `<Window>` itself. */
export type WindowMeta = { title: string; icon: IconName };

type WindowManagerApi = {
  /** Open windows, in the order they appear on the taskbar. */
  openWindows: string[];
  /** The focused window: topmost one that isn't minimized. */
  activeWindow: string | undefined;
  /** Stacking order for the window frame (higher = in front). */
  zIndexOf: (id: string) => number;
  isOpen: (id: string) => boolean;
  isMinimized: (id: string) => boolean;
  isMaximized: (id: string) => boolean;
  /** Opens the window if needed, restores it and brings it to the front. */
  open: (id: string) => void;
  close: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  /** Taskbar click: focus the window, or minimize it if it's already focused. */
  toggleFromTaskbar: (id: string) => void;
  /** Where the user dragged the restored window; undefined = default cascade. */
  positionOf: (id: string) => Point | undefined;
  setPosition: (id: string, point: Point) => void;
  metaOf: (id: string) => WindowMeta | undefined;
  setMeta: (id: string, meta: WindowMeta) => void;
};

const WindowManagerContext = createContext<WindowManagerApi | null>(null);

const without = (list: string[], id: string) => list.filter((r) => r !== id);

/** Program windows are identified by their route; other windows (folders…) by any other id. */
const isRoute = (id: string) => id.startsWith('/');

/**
 * XP-style window state: several windows open at once, stacked in z-order.
 * Program windows are routes, so the focused program and the URL are kept in
 * sync (links, reloads and the back button still work); other windows, such
 * as folders, only live here.
 */
export function WindowManagerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [openWindows, setOpenWindows] = useState<string[]>([]);
  /** Back-to-front stacking order of the open windows. */
  const [zOrder, setZOrder] = useState<string[]>([]);
  const [minimized, setMinimized] = useState<string[]>([]);
  const [maximized, setMaximized] = useState<string[]>([]);
  const [positions, setPositions] = useState<Record<string, Point>>({});
  const [metas, setMetas] = useState<Record<string, WindowMeta>>({});

  const activeWindow = [...zOrder].reverse().find((r) => !minimized.includes(r));

  const open = useCallback((id: string) => {
    setOpenWindows((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setZOrder((prev) => [...without(prev, id), id]);
    setMinimized((prev) => without(prev, id));
  }, []);

  // Arriving at a program's URL (link, reload, back button) focuses its window…
  useEffect(() => {
    if (findProgram(pathname)) open(pathname);
  }, [pathname, open]);

  // …and focusing a program window moves the URL to it.
  useEffect(() => {
    if (activeWindow && isRoute(activeWindow) && activeWindow !== pathname) {
      router.navigate(activeWindow as Href);
    }
    // `pathname` is left out on purpose: only a focus change should navigate.
  }, [activeWindow, router]);

  const close = useCallback((id: string) => {
    setOpenWindows((prev) => without(prev, id));
    setZOrder((prev) => without(prev, id));
    setMinimized((prev) => without(prev, id));
  }, []);

  const minimize = useCallback((id: string) => {
    setMinimized((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setMaximized((prev) => (prev.includes(id) ? without(prev, id) : [...prev, id]));
  }, []);

  const setPosition = useCallback((id: string, point: Point) => {
    setPositions((prev) => ({ ...prev, [id]: point }));
  }, []);

  const setMeta = useCallback((id: string, meta: WindowMeta) => {
    setMetas((prev) =>
      prev[id]?.title === meta.title && prev[id]?.icon === meta.icon ? prev : { ...prev, [id]: meta }
    );
  }, []);

  const api = useMemo<WindowManagerApi>(
    () => ({
      openWindows,
      activeWindow,
      zIndexOf: (id) => zOrder.indexOf(id) + 1,
      isOpen: (id) => openWindows.includes(id),
      isMinimized: (id) => minimized.includes(id),
      isMaximized: (id) => maximized.includes(id),
      open,
      close,
      minimize,
      toggleMaximize,
      toggleFromTaskbar: (id) => (id === activeWindow ? minimize(id) : open(id)),
      positionOf: (id) => positions[id],
      setPosition,
      metaOf: (id) => metas[id],
      setMeta,
    }),
    [
      openWindows,
      activeWindow,
      zOrder,
      minimized,
      maximized,
      positions,
      metas,
      open,
      close,
      minimize,
      toggleMaximize,
      setPosition,
      setMeta,
    ]
  );

  return <WindowManagerContext.Provider value={api}>{children}</WindowManagerContext.Provider>;
}

export function useWindowManager(): WindowManagerApi {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error('useWindowManager must be used within a WindowManagerProvider');
  return ctx;
}

const WindowIdContext = createContext<string | null>(null);

/** Tells a `<Window>` which window (program route, folder…) it is. */
export const WindowIdProvider = WindowIdContext.Provider;

export function useWindowId(): string {
  const id = useContext(WindowIdContext);
  if (id === null) throw new Error('useWindowId must be used within a WindowIdProvider');
  return id;
}
