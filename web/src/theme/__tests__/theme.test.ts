import { bevels, chart, colors, fonts, fontSize, glyphs, gradients, palette, pixelFilters, radius, spacing, webStyle } from '..';

describe('theme', () => {
  it('passes web-only styles through untouched', () => {
    const style = { cursor: 'pointer', boxShadow: bevels.window };

    expect(webStyle(style)).toBe(style);
  });

  it('uses the retro teal and sand palette with the pixel font everywhere', () => {
    expect(colors.background).toBe(palette.sandLight);
    expect(colors.desktop).toBe(palette.tealScreen);
    expect(colors.primary).toBe(palette.teal);
    expect(fonts.body).toBe(fonts.pixel);
    expect(fonts.title).toBe(fonts.pixel);
    expect(fonts.pixel.indexOf('Pixel Digits')).toBeLessThan(fonts.pixel.indexOf('Pixelify Sans'));
    expect(fonts.pixel).toContain('Tahoma');
  });

  it('keeps the spacing and type scales ordered', () => {
    const ascending = (values: number[]) => values.every((v, i) => i === 0 || v > values[i - 1]);

    expect(ascending(Object.values(spacing))).toBe(true);
    expect(ascending(Object.values(fontSize))).toBe(true);
  });

  it('squares every corner for the pixel look', () => {
    expect(Object.values(radius).every((value) => value === 0)).toBe(true);
  });

  it('draws notched 2px pixel borders instead of soft shadows', () => {
    const notch = '0 -2px 0 0 #1C3231, 0 2px 0 0 #1C3231, -2px 0 0 0 #1C3231, 2px 0 0 0 #1C3231';

    for (const key of ['button', 'buttonHover', 'buttonDefault', 'buttonPressed', 'caption', 'window', 'menu', 'iconTile', 'radio', 'startButton', 'startButtonPressed'] as const) {
      expect(bevels[key].startsWith(notch)).toBe(true);
    }
    expect(Object.values(bevels).some((value) => /\dpx \dpx \d+px [1-9]/.test(value))).toBe(false);
  });

  it('gives the spending groups distinct chart colors', () => {
    expect(new Set([chart.essential, chart.variable, chart.superfluous]).size).toBe(3);
  });

  it('paints flat palette colors with pixel dithering instead of gradients', () => {
    expect(gradients.wallpaper).toContain("width='8' height='8'");
    expect(gradients.wallpaper.endsWith(`linear-gradient(${palette.tealScreen}, ${palette.tealScreen})`)).toBe(true);
    expect(gradients.titleBar).toContain("width='4' height='4'");
    expect(gradients.titleBar.endsWith(`linear-gradient(${palette.teal}, ${palette.teal})`)).toBe(true);
    expect(gradients.button).toBe('linear-gradient(#E6DECE, #E6DECE)');
    expect(gradients.progress).toContain('repeating-linear-gradient(to right');
    expect(Object.values(gradients).some((value) => value.includes('radial-gradient') || value.includes('to bottom'))).toBe(false);
  });

  it('ships a pixel checkmark and the icon filter ids', () => {
    expect(glyphs.check).toContain('data:image/svg+xml');
    expect(pixelFilters.small).not.toBe(pixelFilters.large);
    expect(pixelFilters.largeFrom).toBeGreaterThan(0);
  });
});
