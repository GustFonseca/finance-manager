import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { DialogButtons } from '../DialogButtons';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('renders nothing while hidden', () => {
    render(
      <Modal visible={false} onClose={jest.fn()} title="Nova conta">
        <Text>Formulário</Text>
      </Modal>
    );

    expect(screen.queryByText('Formulário')).toBeNull();
  });

  it('shows its title and content in a window', () => {
    render(
      <Modal visible onClose={jest.fn()} title="Nova conta" icon="bank" width={300}>
        <Text>Formulário</Text>
      </Modal>
    );

    expect(screen.getByText('Nova conta')).toBeTruthy();
    expect(screen.getByText('Formulário')).toBeTruthy();
    expect(screen.getByTestId('icon-bank')).toBeTruthy();
  });

  it('closes from the title bar button', () => {
    const onClose = jest.fn();
    render(
      <Modal visible onClose={onClose}>
        <Text>Formulário</Text>
      </Modal>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked but not when the window is', () => {
    const onClose = jest.fn();
    render(
      <Modal visible onClose={onClose} title="Nova conta">
        <Text>Formulário</Text>
      </Modal>
    );

    fireEvent.click(screen.getByText('Formulário'));
    expect(onClose).not.toHaveBeenCalled();

    const windowFrame = screen.getByText('Nova conta').closest('[tabindex]')?.parentElement?.closest('[tabindex]');
    fireEvent.click(windowFrame as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', () => {
    const onClose = jest.fn();
    render(
      <Modal visible onClose={onClose}>
        <Text>Formulário</Text>
      </Modal>
    );

    fireEvent.keyUp(document, { key: 'Escape' });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
});

describe('DialogButtons', () => {
  it('uses OK and Cancelar by default', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(<DialogButtons onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('accepts custom labels and a destructive confirmation', () => {
    render(
      <DialogButtons confirmLabel="Excluir" cancelLabel="Voltar" destructive onConfirm={jest.fn()} onCancel={jest.fn()} />
    );

    expect(screen.getByRole('button', { name: 'Excluir' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeTruthy();
  });

  it('blocks the confirmation while loading', () => {
    const onConfirm = jest.fn();
    render(<DialogButtons onConfirm={onConfirm} onCancel={jest.fn()} loading />);

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByText('OK')).toBeNull();
  });
});
