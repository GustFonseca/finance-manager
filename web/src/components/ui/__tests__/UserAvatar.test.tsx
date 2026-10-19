import React from 'react';
import { render, screen } from '@testing-library/react';
import { palette } from '@/theme';
import { UserAvatar } from '../UserAvatar';

const tile = (name: string) => screen.getByLabelText(`Avatar de ${name}`);

describe('UserAvatar', () => {
  it('shows the first letter on the default tile without an icon', () => {
    render(<UserAvatar name=" gustavo" />);

    expect(screen.getByText('G')).toBeTruthy();
    expect(tile('gustavo').style.width).toBe('40px');
    expect(tile('gustavo').style.backgroundColor).toBe('rgb(224, 165, 38)');
  });

  it('shows the chosen icon on a tile filled with the chosen color', () => {
    render(<UserAvatar name="Gustavo" icon="rocket" color={palette.green} size={64} />);

    expect(screen.getByTestId('icon-rocket')).toBeTruthy();
    expect(screen.queryByText('G')).toBeNull();
    expect(tile('Gustavo').style.height).toBe('64px');
    expect(tile('Gustavo').style.backgroundColor).toBe('rgb(53, 114, 99)');
  });

  it('draws the letter in white over a chosen color', () => {
    render(<UserAvatar name="Ana" color={palette.navy} />);

    expect(screen.getByText('A').style.color).toBe('rgb(255, 255, 255)');
  });

  it('falls back to a placeholder when the name is unknown', () => {
    render(<UserAvatar name={null} />);

    expect(screen.getByText('?')).toBeTruthy();
    expect(tile('Usuário')).toBeTruthy();
  });
});
