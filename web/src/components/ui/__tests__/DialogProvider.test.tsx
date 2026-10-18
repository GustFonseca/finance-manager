import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DialogProvider, useDialog } from '../DialogProvider';

type Api = ReturnType<typeof useDialog>;

function renderDialogs() {
  const ref: { current: Api | null } = { current: null };
  function Capture() {
    ref.current = useDialog();
    return null;
  }
  render(
    <DialogProvider>
      <Capture />
    </DialogProvider>
  );
  return () => ref.current as Api;
}

function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

describe('DialogProvider confirm', () => {
  it('resolves true when confirmed', async () => {
    const dialog = renderDialogs();
    let answer!: Promise<boolean>;
    act(() => {
      answer = dialog().confirm({ title: 'Excluir conta', message: 'Tem certeza?', confirmLabel: 'Excluir', destructive: true });
    });

    expect(screen.getByText('Excluir conta')).toBeTruthy();
    expect(screen.getByText('Tem certeza?')).toBeTruthy();
    expect(screen.getByTestId('icon-question-circle')).toBeTruthy();
    click('Excluir');

    await expect(answer).resolves.toBe(true);
    expect(screen.queryByText('Excluir conta')).toBeNull();
  });

  it('resolves false when cancelled', async () => {
    const dialog = renderDialogs();
    let answer!: Promise<boolean>;
    act(() => {
      answer = dialog().confirm({ title: 'Sair?', cancelLabel: 'Não' });
    });

    expect(screen.queryByTestId('icon-question-circle')).toBeNull();
    click('Não');

    await expect(answer).resolves.toBe(false);
  });

  it('uses OK as the default confirmation label', async () => {
    const dialog = renderDialogs();
    let answer!: Promise<boolean>;
    act(() => {
      answer = dialog().confirm({ title: 'Continuar?' });
    });

    click('OK');

    await expect(answer).resolves.toBe(true);
  });

  it('resolves false when the window is closed', async () => {
    const dialog = renderDialogs();
    let answer!: Promise<boolean>;
    act(() => {
      answer = dialog().confirm({ title: 'Continuar?' });
    });

    click('Fechar');

    await expect(answer).resolves.toBe(false);
    expect(screen.queryByText('Continuar?')).toBeNull();
  });

  it('settles a pending confirmation as false when another dialog opens', async () => {
    const dialog = renderDialogs();
    let first!: Promise<boolean>;
    act(() => {
      first = dialog().confirm({ title: 'Primeira' });
    });
    act(() => {
      dialog().alert({ title: 'Aviso' });
    });

    await expect(first).resolves.toBe(false);
    expect(screen.getByText('Aviso')).toBeTruthy();
    expect(screen.queryByText('Primeira')).toBeNull();
  });
});

describe('DialogProvider alert', () => {
  it('shows the message and closes on OK', () => {
    const dialog = renderDialogs();
    act(() => dialog().alert({ title: 'Importação', message: '3 transações importadas.' }));

    expect(screen.getByText('3 transações importadas.')).toBeTruthy();
    expect(screen.getByTestId('icon-info-circle')).toBeTruthy();
    click('OK');

    expect(screen.queryByText('Importação')).toBeNull();
  });

  it('accepts a custom button label', () => {
    const dialog = renderDialogs();
    act(() => dialog().alert({ title: 'Pronto', okLabel: 'Entendi' }));

    click('Entendi');

    expect(screen.queryByText('Pronto')).toBeNull();
  });
});

describe('DialogProvider menu', () => {
  it('runs the chosen action and closes', () => {
    const dialog = renderDialogs();
    const edit = jest.fn();
    const remove = jest.fn();
    act(() =>
      dialog().menu({
        title: 'Nubank',
        actions: [
          { label: 'Editar', onPress: edit },
          { label: 'Excluir', onPress: remove, destructive: true },
        ],
      })
    );

    click('Excluir');

    expect(remove).toHaveBeenCalledTimes(1);
    expect(edit).not.toHaveBeenCalled();
    expect(screen.queryByText('Nubank')).toBeNull();
  });

  it('closes without running anything on Cancelar', () => {
    const dialog = renderDialogs();
    const edit = jest.fn();
    act(() => dialog().menu({ actions: [{ label: 'Editar', onPress: edit }] }));

    click('Cancelar');

    expect(edit).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
  });
});

describe('useDialog', () => {
  it('requires a DialogProvider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useDialog();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow('useDialog must be used within a DialogProvider');
  });
});
