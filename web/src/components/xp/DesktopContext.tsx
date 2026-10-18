import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { getItem, setItem } from '@/lib/storage';
import type { MenuEntry } from './MenuBar';
import { TASKBAR_HEIGHT } from './StartMenu';
import type { Point } from './useWindowDrag';

const STORAGE_KEY = 'xp_desktop_icons';
export const ICON_CELL = { width: 84, height: 80 };
const MARGIN = 8;

export type IconSlot = number | 'bottom-right';

export type DesktopMenuBuilder = (point: Point) => MenuEntry[];

type DesktopApi = {
  ready: boolean;
  iconPosition: (id: string, slot: IconSlot) => Point;
  moveIcon: (id: string, point: Point) => void;
  clampIcon: (point: Point) => Point;
  arrangeIcons: () => void;
  selectedIcon: string | null;
  selectIcon: (id: string | null) => void;
  renamingIcon: string | null;
  startRename: (id: string) => void;
  stopRename: () => void;
  backgroundMenu: (point: Point) => MenuEntry[];
  setBackgroundMenu: (builder: DesktopMenuBuilder | null) => void;
};

const DesktopContext = createContext<DesktopApi | null>(null);

export function DesktopProvider({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const desktopHeight = height - TASKBAR_HEIGHT;

  const [positions, setPositions] = useState<Record<string, Point>>({});
  const [loaded, setLoaded] = useState(false);
  const [selectedIcon, selectIcon] = useState<string | null>(null);
  const [renamingIcon, setRenamingIcon] = useState<string | null>(null);
  const menuBuilder = useRef<DesktopMenuBuilder | null>(null);

  useEffect(() => {
    getItem(STORAGE_KEY).then((saved) => {
      try {
        if (saved) setPositions(JSON.parse(saved) as Record<string, Point>);
      } catch {
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [loaded, positions]);

  const clampIcon = useCallback(
    (point: Point): Point => ({
      x: Math.min(Math.max(point.x, 0), width - ICON_CELL.width),
      y: Math.min(Math.max(point.y, 0), desktopHeight - ICON_CELL.height),
    }),
    [width, desktopHeight]
  );

  const iconPosition = useCallback(
    (id: string, slot: IconSlot): Point => {
      const saved = positions[id];
      if (saved) return clampIcon(saved);
      if (slot === 'bottom-right') {
        return {
          x: width - ICON_CELL.width - MARGIN,
          y: desktopHeight - ICON_CELL.height - MARGIN,
        };
      }
      const rows = Math.max(1, Math.floor((desktopHeight - MARGIN * 2) / ICON_CELL.height));
      return {
        x: MARGIN + Math.floor(slot / rows) * ICON_CELL.width,
        y: MARGIN + (slot % rows) * ICON_CELL.height,
      };
    },
    [positions, clampIcon, width, desktopHeight]
  );

  const moveIcon = useCallback((id: string, point: Point) => {
    setPositions((prev) => ({ ...prev, [id]: point }));
  }, []);

  const setBackgroundMenu = useCallback((builder: DesktopMenuBuilder | null) => {
    menuBuilder.current = builder;
  }, []);
  const backgroundMenu = useCallback((point: Point) => menuBuilder.current?.(point) ?? [], []);

  const api = useMemo<DesktopApi>(
    () => ({
      ready: loaded,
      iconPosition,
      moveIcon,
      clampIcon,
      arrangeIcons: () => setPositions({}),
      selectedIcon,
      selectIcon,
      renamingIcon,
      startRename: (id) => {
        selectIcon(id);
        setRenamingIcon(id);
      },
      stopRename: () => setRenamingIcon(null),
      backgroundMenu,
      setBackgroundMenu,
    }),
    [loaded, iconPosition, moveIcon, clampIcon, selectedIcon, renamingIcon, backgroundMenu, setBackgroundMenu]
  );

  return <DesktopContext.Provider value={api}>{children}</DesktopContext.Provider>;
}

export function useDesktop(): DesktopApi {
  const ctx = useContext(DesktopContext);
  if (!ctx) throw new Error('useDesktop must be used within a DesktopProvider');
  return ctx;
}

export function useDesktopMenu(builder: DesktopMenuBuilder) {
  const { setBackgroundMenu } = useDesktop();
  setBackgroundMenu(builder);
  useEffect(() => () => setBackgroundMenu(null), [setBackgroundMenu]);
}
