import { useRef, useState } from 'react';
import type { PointerEvent as RNPointerEvent } from 'react-native';

export type Point = { x: number; y: number };

const DOUBLE_CLICK_MS = 400;

type Options = {
  /** Where the window currently is. */
  position: Point;
  /** Keeps a candidate position inside the desktop. */
  clamp: (point: Point) => Point;
  /** Called once when the drag ends, with the final position. */
  onDragEnd: (point: Point) => void;
  /** Double-click on the title bar (maximize / restore). */
  onDoubleClick: () => void;
  /** Maximized windows can't be dragged, but still react to double-click. */
  draggable: boolean;
};

/**
 * Title-bar dragging for XP windows. The in-progress position stays local to
 * the window (so the WindowManager only updates when the drag ends), and the
 * listeners live on `window` so fast pointer moves can't escape the bar.
 */
export function useWindowDrag({ position, clamp, onDragEnd, onDoubleClick, draggable }: Options) {
  const [dragPosition, setDragPosition] = useState<Point | null>(null);
  const lastPointerDown = useRef(0);

  function onPointerDown(event: RNPointerEvent) {
    // react-native-web hands us the DOM event; RN's types describe the native one.
    const dom = event.nativeEvent as unknown as PointerEvent;
    if (dom.button !== 0) return;
    // Clicks on the minimize / maximize / close buttons aren't drags.
    if ((dom.target as HTMLElement).closest('[role="button"]')) return;

    const now = Date.now();
    if (now - lastPointerDown.current < DOUBLE_CLICK_MS) {
      lastPointerDown.current = 0;
      onDoubleClick();
      return;
    }
    lastPointerDown.current = now;
    if (!draggable) return;

    dom.preventDefault();
    const startX = dom.clientX;
    const startY = dom.clientY;
    let current = position;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const move = (e: PointerEvent) => {
      current = clamp({ x: position.x + e.clientX - startX, y: position.y + e.clientY - startY });
      setDragPosition(current);
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      document.body.style.userSelect = previousUserSelect;
      setDragPosition(null);
      onDragEnd(current);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  return { position: dragPosition ?? position, dragging: dragPosition !== null, onPointerDown };
}
