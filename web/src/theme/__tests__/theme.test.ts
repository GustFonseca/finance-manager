import { bevels, chart, colors, fonts, fontSize, gradients, radius, spacing, webStyle } from '..';

describe('theme', () => {
  it('passes web-only styles through untouched', () => {
    const style = { cursor: 'pointer', boxShadow: bevels.window };

    expect(webStyle(style)).toBe(style);
  });

  it('uses the XP palette and Tahoma', () => {
    expect(colors.background).toBe('#ECE9D8');
    expect(colors.desktop).toBe('#3A6EA5');
    expect(fonts.body).toContain('Tahoma');
  });

  it('keeps the spacing and type scales ordered', () => {
    const ascending = (values: number[]) => values.every((v, i) => i === 0 || v > values[i - 1]);

    expect(ascending(Object.values(spacing))).toBe(true);
    expect(ascending(Object.values(fontSize))).toBe(true);
    expect(ascending(Object.values(radius))).toBe(true);
  });

  it('gives the spending groups distinct chart colors', () => {
    expect(new Set([chart.essential, chart.variable, chart.superfluous]).size).toBe(3);
  });

  it('layers the wallpaper from several gradients', () => {
    expect(gradients.wallpaper.split('gradient(').length - 1).toBe(7);
  });
});
