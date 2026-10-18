import { fireEvent } from '@testing-library/react';

export function hover(element: Element) {
  fireEvent.mouseEnter(element);
}

export function unhover(element: Element) {
  fireEvent.mouseLeave(element);
}

export function holdDown(element: Element) {
  fireEvent.keyDown(element, { key: 'Enter' });
}

export function release(element: Element) {
  fireEvent.keyUp(element, { key: 'Enter' });
}
