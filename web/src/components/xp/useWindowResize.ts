import { useState } from 'react';
import type { PointerEvent as RNPointerEvent } from 'react-native';

export type Rect = { x: number; y: number; width: number; height: number };
export type Size = { width: number; height: number };
export type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const EDGES: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
export const MIN_WINDOW: Size = { width: 360, height: 240 };

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

export function resizeRect(start: Rect, edge: Edge, dx: number, dy: number, bounds: Size): Rect {
  let { x, y, width, height } = start;
  if (edge.includes('e')) width = clampValue(start.width + dx, MIN_WINDOW.width, bounds.width - start.x);
  if (edge.includes('s')) height = clampValue(start.height + dy, MIN_WINDOW.height, bounds.height - start.y);
  if (edge.includes('w')) {
    x = clampValue(start.x + dx, 0, start.x + start.width - MIN_WINDOW.width);
    width = start.width + start.x - x;
  }
  if (edge.includes('n')) {
    y = clampValue(start.y + dy, 0, start.y + start.height - MIN_WINDOW.height);
    height = start.height + start.y - y;
  }
  return { x, y, width, height };
}

type Options = {
  rect: Rect;
  bounds: Size;
  enabled: boolean;
  onResizeEnd: (rect: Rect) => void;
};

export function useWindowResize({ rect, bounds, enabled, onResizeEnd }: Options) {
  const [live, setLive] = useState<Rect | null>(null);

  const start = (edge: Edge) => (event: RNPointerEvent) => {
    const dom = event.nativeEvent as unknown as PointerEvent;
    if (!enabled || dom.button !== 0) return;
    dom.preventDefault();
    dom.stopPropagation();
    const startX = dom.clientX;
    const startY = dom.clientY;
    let current = rect;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const move = (e: PointerEvent) => {
      current = resizeRect(rect, edge, e.clientX - startX, e.clientY - startY, bounds);
      setLive(current);
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      document.body.style.userSelect = previousUserSelect;
      setLive(null);
      onResizeEnd(current);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  return { rect: live ?? rect, resizing: live !== null, start };
}
