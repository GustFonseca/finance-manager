import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { apiError } from '@/test/http';
import { rulesApi } from '../api';
import { RulesScreen } from '../RulesScreen';
import { rule, rules } from './fixtures';

jest.mock('../api');

const api = jest.mocked(rulesApi);

function renderScreen() {
  return renderWithProviders(<RulesScreen />, { windowId: '/rules' });
}

function inputOf(label: string) {
  return screen.getByText(label).parentElement!.querySelector('input')!;
}

function typeFilter() {
  return screen.getByText('Tipo:').parentElement!.querySelector('select')!;
}

function search() {
  return screen.getByLabelText('Procurar regras');
}

function toolbarButton(label: string) {
  return screen.getAllByRole('button').find((b) => within(b).queryByText(label))!;
}

function rowOf(pattern: string) {
  return screen.getByText(pattern).parentElement!.parentElement as HTMLElement;
}

beforeEach(() => {
  api.getAll.mockResolvedValue(rules);
  api.create.mockResolvedValue(rule({ id: 'r9' }));
  api.update.mockResolvedValue(rule());
  api.setActive.mockResolvedValue(rule({ isActive: false }));
});

describe('RulesScreen', () => {
  it('lists every rule with its details', async () => {
    renderScreen();

    expect(screen.getByText('Atualizando...')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('3 de 3 regra(s)')).toBeTruthy());
    expect(screen.getByText('Regras de classificação')).toBeTruthy();
    expect(within(rowOf('\\bifood\\b')).getByText('Marca')).toBeTruthy();
    expect(within(rowOf('cinema|teatro')).getByText('Supérfluo')).toBeTruthy();
    expect(within(rowOf('tarifa')).getByText('Tarifa ou juros')).toBeTruthy();
    expect(screen.getByText('→ Tarifa bancária')).toBeTruthy();
    expect(screen.getAllByText('padrão')).toHaveLength(1);
    expect(screen.getByText('Prioridade 50')).toBeTruthy();
    expect(screen.getAllByLabelText('Ativa').map((box) => (box as HTMLInputElement).checked)).toEqual([true, false, true]);
  });

  it('filters by type and searches pattern, value and note ignoring accents', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('3 de 3 regra(s)')).toBeTruthy());
    expect(typeFilter().options[0].textContent).toBe('Todos os tipos');

    fireEvent.change(typeFilter(), { target: { value: 'FEE' } });
    expect(screen.getByText('1 de 3 regra(s)')).toBeTruthy();
    expect(screen.getByText('tarifa')).toBeTruthy();
    expect(screen.queryByText('cinema|teatro')).toBeNull();

    fireEvent.change(typeFilter(), { target: { value: '' } });
    fireEvent.change(search(), { target: { value: 'BANCARIA' } });
    expect(screen.getByText('1 de 3 regra(s)')).toBeTruthy();

    fireEvent.change(search(), { target: { value: 'lazer' } });
    expect(screen.getByText('cinema|teatro')).toBeTruthy();
    expect(screen.queryByText('tarifa')).toBeNull();

    fireEvent.change(search(), { target: { value: 'ifood' } });
    expect(screen.getByText('\\bifood\\b')).toBeTruthy();

    fireEvent.change(typeFilter(), { target: { value: 'GROCERY' } });
    expect(screen.getByText('Nenhuma regra encontrada com esses filtros.')).toBeTruthy();
  });

  it('shows the empty state without rules', async () => {
    api.getAll.mockResolvedValue([]);
    renderScreen();

    await waitFor(() => expect(screen.getByText('0 de 0 regra(s)')).toBeTruthy());
    expect(screen.getByText('Nenhuma regra cadastrada.')).toBeTruthy();
  });

  it('shows the error state and retries', async () => {
    api.getAll.mockRejectedValueOnce(apiError('Acesso negado', 403));
    renderScreen();

    await waitFor(() => expect(screen.getByText('Acesso negado')).toBeTruthy());
    expect(screen.queryByLabelText('Procurar regras')).toBeNull();
    fireEvent.click(screen.getByText('Tentar de novo'));

    await waitFor(() => expect(screen.getByText('3 de 3 regra(s)')).toBeTruthy());
  });

  it('falls back to a generic error message', async () => {
    api.getAll.mockRejectedValueOnce(new Error('x'));
    renderScreen();

    await waitFor(() => expect(screen.getByText('Não foi possível carregar as regras')).toBeTruthy());
  });

  it('refreshes from the toolbar', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('3 de 3 regra(s)')).toBeTruthy());

    fireEvent.click(toolbarButton('Atualizar'));

    await waitFor(() => expect(api.getAll).toHaveBeenCalledTimes(2));
  });

  it('turns a rule off and reloads everything', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('3 de 3 regra(s)')).toBeTruthy());

    fireEvent.click(within(rowOf('\\bifood\\b')).getByLabelText('Ativa'));

    await waitFor(() => expect(api.setActive).toHaveBeenCalledWith('r1', false));
    await waitFor(() => expect(api.getAll).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Editar regra')).toBeNull();
  });

  it('alerts when turning a rule on fails', async () => {
    api.setActive.mockRejectedValue(new Error('x'));
    renderScreen();
    await waitFor(() => expect(screen.getByText('3 de 3 regra(s)')).toBeTruthy());

    fireEvent.click(within(rowOf('cinema|teatro')).getByLabelText('Ativa'));

    await waitFor(() => expect(screen.getByText('Não foi possível alterar a regra')).toBeTruthy());
    expect(api.setActive).toHaveBeenCalledWith('r2', true);
  });

  it('creates a rule and reloads everything', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('3 de 3 regra(s)')).toBeTruthy());

    fireEvent.click(toolbarButton('Nova regra'));
    expect(screen.getAllByText('Nova regra')).toHaveLength(2);
    fireEvent.change(inputOf('Padrão (expressão regular):'), { target: { value: 'netflix' } });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({ type: 'SUPERFLUOUS', pattern: 'netflix', value: null, priority: 100, note: null })
    );
    await waitFor(() => expect(screen.queryByText('Salvar')).toBeNull());
    await waitFor(() => expect(api.getAll).toHaveBeenCalledTimes(2));
  });

  it('edits a rule from the row and from the edit button', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('3 de 3 regra(s)')).toBeTruthy());

    fireEvent.click(screen.getByText('Lazer pago'));
    expect(screen.getByText('Editar regra')).toBeTruthy();
    expect(inputOf('Padrão (expressão regular):').value).toBe('cinema|teatro');
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Editar regra')).toBeNull());

    fireEvent.click(within(rowOf('tarifa')).getByText('Editar'));
    expect(inputOf('Valor (obrigatório para este tipo):').value).toBe('Tarifa bancária');
    fireEvent.change(inputOf('Prioridade:'), { target: { value: '20' } });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('r3', {
        type: 'FEE',
        pattern: 'tarifa',
        value: 'Tarifa bancária',
        priority: 20,
        note: null,
      })
    );
    await waitFor(() => expect(screen.queryByText('Editar regra')).toBeNull());
  });

  it('keeps the form open and shows the server message when saving fails', async () => {
    api.update.mockRejectedValueOnce(apiError('Padrão inválido'));
    renderScreen();
    await waitFor(() => expect(screen.getByText('3 de 3 regra(s)')).toBeTruthy());

    fireEvent.click(within(rowOf('\\bifood\\b')).getByText('Editar'));
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => expect(screen.getByText('Padrão inválido')).toBeTruthy());
    expect(screen.getByText('Editar regra')).toBeTruthy();
    fireEvent.click(screen.getByText('OK'));

    api.update.mockRejectedValueOnce(new Error('x'));
    fireEvent.click(screen.getByText('Salvar'));
    await waitFor(() => expect(screen.getByText('Não foi possível salvar a regra')).toBeTruthy());
  });
});
