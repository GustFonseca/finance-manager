import { MIN_WINDOW, resizeRect } from '../useWindowResize';

const start = { x: 100, y: 50, width: 600, height: 400 };
const bounds = { width: 1200, height: 760 };

describe('resizeRect', () => {
  it('grows and shrinks from the right and bottom edges', () => {
    expect(resizeRect(start, 'e', 80, 30, bounds)).toEqual({ x: 100, y: 50, width: 680, height: 400 });
    expect(resizeRect(start, 's', 80, -30, bounds)).toEqual({ x: 100, y: 50, width: 600, height: 370 });
    expect(resizeRect(start, 'se', 50, 60, bounds)).toEqual({ x: 100, y: 50, width: 650, height: 460 });
  });

  it('moves the origin when pulling the left and top edges', () => {
    expect(resizeRect(start, 'w', -40, 0, bounds)).toEqual({ x: 60, y: 50, width: 640, height: 400 });
    expect(resizeRect(start, 'n', 0, 20, bounds)).toEqual({ x: 100, y: 70, width: 600, height: 380 });
    expect(resizeRect(start, 'nw', -10, -10, bounds)).toEqual({ x: 90, y: 40, width: 610, height: 410 });
    expect(resizeRect(start, 'ne', 10, -10, bounds)).toEqual({ x: 100, y: 40, width: 610, height: 410 });
    expect(resizeRect(start, 'sw', -10, 10, bounds)).toEqual({ x: 90, y: 50, width: 610, height: 410 });
  });

  it('never goes below the minimum size nor outside the screen', () => {
    expect(resizeRect(start, 'se', -5000, -5000, bounds)).toEqual({ x: 100, y: 50, ...MIN_WINDOW });
    expect(resizeRect(start, 'se', 5000, 5000, bounds)).toEqual({ x: 100, y: 50, width: 1100, height: 710 });
    expect(resizeRect(start, 'nw', 5000, 5000, bounds)).toEqual({
      x: 100 + 600 - MIN_WINDOW.width,
      y: 50 + 400 - MIN_WINDOW.height,
      ...MIN_WINDOW,
    });
    expect(resizeRect(start, 'nw', -5000, -5000, bounds)).toEqual({ x: 0, y: 0, width: 700, height: 450 });
  });

  it('keeps the minimum even when the screen is smaller than it', () => {
    expect(resizeRect({ x: 0, y: 0, width: 300, height: 200 }, 'se', 0, 0, { width: 300, height: 200 })).toEqual({
      x: 0,
      y: 0,
      ...MIN_WINDOW,
    });
  });
});
