import { useRef, useState } from 'react';
import type { PointerEvent as RNPointerEvent } from 'react-native';

export type Point = { x: number; y: number };

const DOUBLE_CLICK_MS = 400;

type Options = {
  position: Point;
  clamp: (point: Point) => Point;
  onDragEnd: (point: Point) => void;
  onDoubleClick: () => void;
  draggable: boolean;
};

export function useWindowDrag({ position, clamp, onDragEnd, onDoubleClick, draggable }: Options) {
  const [dragPosition, setDragPosition] = useState<Point | null>(null);
  const lastPointerDown = useRef(0);

  function onPointerDown(event: RNPointerEvent) {
    const dom = event.nativeEvent as unknown as PointerEvent;
    if (dom.button !== 0) return;
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
