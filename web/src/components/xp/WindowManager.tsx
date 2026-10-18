import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Href, usePathname, useRouter } from 'expo-router';
import { findProgram } from './programs';
import type { IconName } from './TitleBar';
import type { Point } from './useWindowDrag';

export type WindowMeta = { title: string; icon: IconName };

type WindowManagerApi = {
  openWindows: string[];
  activeWindow: string | undefined;
  zIndexOf: (id: string) => number;
  isOpen: (id: string) => boolean;
  isMinimized: (id: string) => boolean;
  isMaximized: (id: string) => boolean;
  open: (id: string) => void;
  close: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  toggleFromTaskbar: (id: string) => void;
  positionOf: (id: string) => Point | undefined;
  setPosition: (id: string, point: Point) => void;
  metaOf: (id: string) => WindowMeta | undefined;
  setMeta: (id: string, meta: WindowMeta) => void;
};

const WindowManagerContext = createContext<WindowManagerApi | null>(null);

const without = (list: string[], id: string) => list.filter((r) => r !== id);

const isRoute = (id: string) => id.startsWith('/');

export function WindowManagerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [openWindows, setOpenWindows] = useState<string[]>([]);
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

  useEffect(() => {
    if (findProgram(pathname)) open(pathname);
  }, [pathname, open]);

  useEffect(() => {
    if (activeWindow && isRoute(activeWindow) && activeWindow !== pathname) {
      router.navigate(activeWindow as Href);
    }
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

export const WindowIdProvider = WindowIdContext.Provider;

export function useWindowId(): string {
  const id = useContext(WindowIdContext);
  if (id === null) throw new Error('useWindowId must be used within a WindowIdProvider');
  return id;
}
