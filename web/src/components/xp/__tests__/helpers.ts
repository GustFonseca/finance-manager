import { act, fireEvent } from '@testing-library/react';

type PointerInit = MouseEventInit & { pointerType?: string };

class TestPointerEvent extends MouseEvent {
  pointerType: string;
  constructor(type: string, init: PointerInit = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? 'mouse';
  }
}

export function installPointerEvent() {
  (globalThis as unknown as { PointerEvent: typeof TestPointerEvent }).PointerEvent = TestPointerEvent;
}

installPointerEvent();

export function setViewport(width: number, height: number) {
  Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: width });
  Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: height });
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

export function pointerDown(element: Element, init: PointerInit = {}) {
  fireEvent.pointerDown(element, { button: 0, ...init });
}

export function pointerMove(init: PointerInit) {
  act(() => {
    window.dispatchEvent(new TestPointerEvent('pointermove', init));
  });
}

export function pointerUp(type: 'pointerup' | 'pointercancel' = 'pointerup') {
  act(() => {
    window.dispatchEvent(new TestPointerEvent(type));
  });
}

export function hover(element: Element) {
  fireEvent.pointerEnter(element, { pointerType: 'mouse' });
}

export function unhover(element: Element) {
  fireEvent.pointerLeave(element, { pointerType: 'mouse' });
}
