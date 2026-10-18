import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../Button';
import { holdDown, hover } from './pointer';

describe('Button', () => {
  it('shows its label and calls onPress when clicked', () => {
    const onPress = jest.fn();
    render(<Button label="Salvar" onPress={onPress} />);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress while disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Salvar" onPress={onPress} disabled />);

    fireEvent.click(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button').getAttribute('aria-disabled')).toBe('true');
  });

  it('replaces the label with a spinner while loading', () => {
    const onPress = jest.fn();
    render(<Button label="Salvar" onPress={onPress} loading />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.queryByText('Salvar')).toBeNull();
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(onPress).not.toHaveBeenCalled();
  });

  it.each(['primary', 'secondary', 'success', 'danger'] as const)('renders the %s variant', (variant) => {
    render(<Button label={variant} variant={variant} size="sm" onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: variant })).toBeTruthy();
  });

  it('highlights on hover and while pressed', () => {
    render(<Button label="Salvar" onPress={jest.fn()} />);
    const button = screen.getByRole('button');
    const idle = button.className;

    hover(button);
    const hovered = button.className;
    holdDown(button);

    expect(hovered).not.toBe(idle);
    expect(button.className).not.toBe(hovered);
  });

  it('does not highlight on hover while disabled', () => {
    render(<Button label="Salvar" onPress={jest.fn()} disabled />);
    const button = screen.getByRole('button');
    const idle = button.className;

    hover(button);

    expect(button.className).toBe(idle);
  });
});
