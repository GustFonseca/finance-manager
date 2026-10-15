import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Href, usePathname, useRouter } from 'expo-router';
import { findProgram } from './programs';

type WindowManagerApi = {
  /** Open windows, in the order they appear on the taskbar. */
  openRoutes: string[];
  /** Route of the window currently shown (the URL); may be closed/minimized. */
  currentRoute: string;
  isMinimized: (route: string) => boolean;
  isMaximized: (route: string) => boolean;
  /** True when `route` is the current URL and its window is open and not minimized. */
  isVisible: (route: string) => boolean;
  open: (route: string) => void;
  close: (route: string) => void;
  minimize: (route: string) => void;
  toggleMaximize: (route: string) => void;
  /** Taskbar click: restore/focus the window, or minimize it if it's already in front. */
  toggleFromTaskbar: (route: string) => void;
};

const WindowManagerContext = createContext<WindowManagerApi | null>(null);

/**
 * Keeps XP-style window state (open, minimized, maximized) on top of the
 * router: each program is a route, and the window in front is the current URL.
 */
export function WindowManagerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [openRoutes, setOpenRoutes] = useState<string[]>([]);
  const [minimized, setMinimized] = useState<string[]>([]);
  const [restored, setRestored] = useState<string[]>([]);

  const addOpen = useCallback((route: string) => {
    setOpenRoutes((prev) => (prev.includes(route) ? prev : [...prev, route]));
    setMinimized((prev) => prev.filter((r) => r !== route));
  }, []);

  // Arriving at a program's URL (link, reload, back button) opens its window.
  useEffect(() => {
    if (findProgram(pathname)) addOpen(pathname);
  }, [pathname, addOpen]);

  const navigate = useCallback((route: string) => router.navigate(route as Href), [router]);

  const open = useCallback(
    (route: string) => {
      addOpen(route);
      if (route !== pathname) navigate(route);
    },
    [addOpen, navigate, pathname]
  );

  const close = useCallback(
    (route: string) => {
      const remaining = openRoutes.filter((r) => r !== route);
      setOpenRoutes(remaining);
      setMinimized((prev) => prev.filter((r) => r !== route));
      // Bring the most recently opened, non-minimized window to the front.
      if (route === pathname) {
        const next = [...remaining].reverse().find((r) => !minimized.includes(r));
        if (next) navigate(next);
      }
    },
    [openRoutes, minimized, pathname, navigate]
  );

  const minimize = useCallback((route: string) => {
    setMinimized((prev) => (prev.includes(route) ? prev : [...prev, route]));
  }, []);

  const toggleMaximize = useCallback((route: string) => {
    setRestored((prev) =>
      prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route]
    );
  }, []);

  const api = useMemo<WindowManagerApi>(() => {
    const isMinimized = (route: string) => minimized.includes(route);
    const isVisible = (route: string) =>
      route === pathname && openRoutes.includes(route) && !isMinimized(route);
    return {
      openRoutes,
      currentRoute: pathname,
      isMinimized,
      // Windows open maximized; the button toggles them to the restored size.
      isMaximized: (route) => !restored.includes(route),
      isVisible,
      open,
      close,
      minimize,
      toggleMaximize,
      toggleFromTaskbar: (route) => (isVisible(route) ? minimize(route) : open(route)),
    };
  }, [openRoutes, minimized, restored, pathname, open, close, minimize, toggleMaximize]);

  return <WindowManagerContext.Provider value={api}>{children}</WindowManagerContext.Provider>;
}

export function useWindowManager(): WindowManagerApi {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error('useWindowManager must be used within a WindowManagerProvider');
  return ctx;
}
