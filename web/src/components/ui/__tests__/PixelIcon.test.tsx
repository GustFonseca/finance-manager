import React from 'react';
import { render, screen } from '@testing-library/react';
import { StyleSheet } from 'react-native';
import { pixelFilters } from '@/theme';
import { PixelFilters, PixelIcon } from '../PixelIcon';

function filterOf(element: React.ReactElement) {
  return (StyleSheet.flatten((element.props as { style: unknown }).style) as { filter?: string }).filter;
}

describe('PixelIcon', () => {
  it('renders the FontAwesome glyph with its name and color', () => {
    render(<PixelIcon name="bank" size={18} color="#123456" />);

    expect(screen.getByTestId('icon-bank')).toBeTruthy();
  });

  it('keeps small icons crisp and blocks large icons into 2px pixels', () => {
    expect(filterOf(PixelIcon({ name: 'bank', size: pixelFilters.largeFrom - 1 }))).toBe(`url(#${pixelFilters.small})`);
    expect(filterOf(PixelIcon({ name: 'bank', size: pixelFilters.largeFrom }))).toBe(`url(#${pixelFilters.large})`);
    expect(filterOf(PixelIcon({ name: 'bank' }))).toBe(`url(#${pixelFilters.small})`);
  });

  it('lets callers add their own style on top of the filter', () => {
    const element = PixelIcon({ name: 'bank', size: 30, style: { marginRight: 6 } });

    expect(StyleSheet.flatten((element.props as { style: unknown }).style)).toMatchObject({
      marginRight: 6,
      filter: `url(#${pixelFilters.large})`,
    });
  });
});

describe('PixelFilters', () => {
  it('defines a hidden crisp filter and a 2px block filter', () => {
    const { container } = render(<PixelFilters />);

    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    const small = svg.querySelector(`filter#${pixelFilters.small}`)!;
    const large = svg.querySelector(`filter#${pixelFilters.large}`)!;
    expect(small.querySelectorAll('feOffset')).toHaveLength(0);
    expect(large.querySelectorAll('feOffset')).toHaveLength(2);
    expect(large.querySelector('feComposite')!.getAttribute('width')).toBe('2');
    expect(large.querySelector('feFuncA')!.getAttribute('type')).toBe('discrete');
  });
});
