import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { ListItem } from '../ListItem';
import { holdDown, hover } from './pointer';

function row() {
  return screen.getByText('Nubank').parentElement as HTMLElement;
}

describe('ListItem', () => {
  it('calls onPress when clicked', () => {
    const onPress = jest.fn();
    render(
      <ListItem onPress={onPress}>
        <Text>Nubank</Text>
      </ListItem>
    );

    fireEvent.click(screen.getByText('Nubank'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reports the cursor position on right click', () => {
    const onRightClick = jest.fn();
    render(
      <ListItem onPress={jest.fn()} onRightClick={onRightClick}>
        <Text>Nubank</Text>
      </ListItem>
    );

    fireEvent.contextMenu(row(), { clientX: 40, clientY: 75 });

    expect(onRightClick).toHaveBeenCalledWith({ x: 40, y: 75 });
  });

  it('ignores right clicks when no handler is given', () => {
    const onPress = jest.fn();
    render(
      <ListItem onPress={onPress}>
        <Text>Nubank</Text>
      </ListItem>
    );

    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    row().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('highlights on hover, while pressed and when selected', () => {
    const { rerender } = render(
      <ListItem onPress={jest.fn()}>
        <Text>Nubank</Text>
      </ListItem>
    );
    const idle = row().className;

    hover(row());
    const hovered = row().className;
    holdDown(row());

    expect(hovered).not.toBe(idle);
    expect(row().className).not.toBe(hovered);

    rerender(
      <ListItem onPress={jest.fn()} selected>
        <Text>Nubank</Text>
      </ListItem>
    );

    expect(row().className).not.toBe(idle);
  });
});
