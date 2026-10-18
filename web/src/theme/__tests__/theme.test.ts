import { bevels, chart, colors, fonts, fontSize, gradients, palette, radius, spacing, webStyle } from '..';

describe('theme', () => {
  it('passes web-only styles through untouched', () => {
    const style = { cursor: 'pointer', boxShadow: bevels.window };

    expect(webStyle(style)).toBe(style);
  });

  it('uses the retro teal and sand palette with Tahoma and a pixel display font', () => {
    expect(colors.background).toBe(palette.sandLight);
    expect(colors.desktop).toBe(palette.tealScreen);
    expect(colors.primary).toBe(palette.teal);
    expect(fonts.body).toContain('Tahoma');
    expect(fonts.pixel).toContain('Pixelify Sans');
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

  it('layers the wallpaper from scanlines over a teal glow', () => {
    expect(gradients.wallpaper.split('gradient(').length - 1).toBe(2);
    expect(gradients.wallpaper).toContain(palette.tealScreen);
  });
});
