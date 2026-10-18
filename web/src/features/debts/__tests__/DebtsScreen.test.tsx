import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { formatCents, INVALID_AMOUNT_MESSAGE } from '@/lib/money';
import { apiError } from '@/test/http';
import { renderWithProviders } from '@/test/render';
import { DebtsScreen } from '../DebtsScreen';
import { debtsApi } from '../api';
import { DEBT_MINIMUM_INVALID, DEBT_NAME_REQUIRED, DEBT_RATE_INVALID, formatRate, parseRate } from '../components/DebtForm';
import { monthsText } from '../components/StrategyCard';
import { debt, plan, strategy } from './fixtures';

jest.mock('../api');

const api = jest.mocked(debtsApi);
const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');
const card = debt();
const loan = debt({ id: 'd2', name: 'Empréstimo', balanceCents: 100000, monthlyRatePercent: 3, minimumPaymentCents: 30000 });

function inputOf(label: string) {
  return screen.getByText(label).parentElement!.querySelector('input')!;
}

function toolbarButton(label: string) {
  return screen.getAllByRole('button').find((b) => within(b).queryByText(label))!;
}

function renderScreen() {
  return renderWithProviders(<DebtsScreen />, { windowId: '/debts' });
}

beforeEach(() => {
  api.plan.mockResolvedValue(plan());
});

describe('debt helpers', () => {
  it('parses monthly rates with comma, dot or percent sign', () => {
    expect(parseRate('2,5')).toBe(2.5);
    expect(parseRate(' 3.75 % ')).toBe(3.75);
    expect(parseRate('0')).toBe(0);
    expect(parseRate('')).toBeNull();
    expect(parseRate('abc')).toBeNull();
    expect(formatRate(12.5)).toBe('12,5');
  });

  it('writes months in Portuguese', () => {
    expect(monthsText(1)).toBe('1 mês');
    expect(monthsText(3)).toBe('3 meses');
  });
});

describe('DebtsScreen', () => {
  it('shows the empty state without simulating', async () => {
    api.getAll.mockResolvedValue([]);
    renderScreen();

    expect(screen.getByText('Atualizando...')).toBeTruthy();
    await waitFor(() => expect(screen.getByText(`0 dívida(s) · ${money(0)} no total`)).toBeTruthy());
    expect(screen.getByText(/Nenhuma dívida cadastrada/)).toBeTruthy();

    fireEvent.click(toolbarButton('Atualizar'));
    await waitFor(() => expect(api.getAll).toHaveBeenCalledTimes(2));
    expect(api.plan).not.toHaveBeenCalled();
  });

  it('lists the debts and compares avalanche with snowball', async () => {
    api.getAll.mockResolvedValue([card, loan]);
    renderScreen();

    await waitFor(() => expect(screen.getByText(`2 dívida(s) · ${money(450000)} no total`)).toBeTruthy());
    expect(screen.getByText(`12,5% ao mês · parcela mínima de ${money(20000)}`)).toBeTruthy();
    expect(await screen.findByText(/Pagando R\$ 500,00 por mês/)).toBeTruthy();
    expect(api.plan).toHaveBeenCalledWith(0);
    expect(screen.getByText('14 meses')).toBeTruthy();
    expect(screen.getByText('15 meses')).toBeTruthy();
    expect(screen.getByText(money(80000))).toBeTruthy();
    expect(screen.getByText(money(95000))).toBeTruthy();
    expect(screen.getByText('1. Cartão — quitada no mês 9')).toBeTruthy();
    expect(screen.getByText('1. Empréstimo — quitada no mês 1')).toBeTruthy();
    expect(screen.getByText(`A avalanche economiza ${money(15000)} em juros.`)).toBeTruthy();

    fireEvent.click(toolbarButton('Atualizar'));
    await waitFor(() => expect(api.plan).toHaveBeenCalledTimes(2));
  });

  it('says when both strategies cost the same', async () => {
    api.getAll.mockResolvedValue([card]);
    api.plan.mockResolvedValue(plan({ interestSavedWithAvalancheCents: 0, snowball: strategy({ months: 1 }) }));
    renderScreen();

    expect(await screen.findByText(/As duas estratégias custam o mesmo/)).toBeTruthy();
    expect(screen.getByText('1 mês')).toBeTruthy();
  });

  it('warns when the payments never pay the debt off', async () => {
    api.getAll.mockResolvedValue([card]);
    api.plan.mockResolvedValue(plan({ avalanche: strategy({ feasible: false }), snowball: strategy({ feasible: false }) }));
    renderScreen();

    await waitFor(() => expect(screen.getAllByText(/a dívida não acaba/)).toHaveLength(2));
    expect(screen.queryByText(/A avalanche economiza/)).toBeNull();
  });

  it('simulates with an extra amount per month', async () => {
    api.getAll.mockResolvedValue([card]);
    renderScreen();

    await screen.findByText(/Pagando/);
    const extra = inputOf('Extra por mês além das parcelas mínimas:');
    fireEvent.change(extra, { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Simular'));
    expect(screen.getByText(INVALID_AMOUNT_MESSAGE)).toBeTruthy();

    fireEvent.change(extra, { target: { value: '300,00' } });
    fireEvent.click(screen.getByText('Simular'));
    await waitFor(() => expect(api.plan).toHaveBeenCalledWith(30000));
    expect(screen.queryByText(INVALID_AMOUNT_MESSAGE)).toBeNull();

    fireEvent.change(extra, { target: { value: '0,00' } });
    fireEvent.click(screen.getByText('Simular'));
    await waitFor(() => expect(screen.getByText(/Pagando/)).toBeTruthy());
  });

  it('shows simulation errors that can be retried', async () => {
    api.getAll.mockResolvedValue([card]);
    api.plan.mockRejectedValue(new Error('x'));
    renderScreen();

    expect(await screen.findByText('Não foi possível simular a quitação')).toBeTruthy();
    api.plan.mockResolvedValue(plan());
    fireEvent.click(screen.getByText('Tentar de novo'));
    expect(await screen.findByText(/Pagando/)).toBeTruthy();
  });

  it('shows an error that can be retried', async () => {
    api.getAll.mockRejectedValue(new Error('boom'));
    renderScreen();

    expect(await screen.findByText('Não foi possível carregar as dívidas')).toBeTruthy();
    api.getAll.mockResolvedValue([card]);
    fireEvent.click(screen.getByText('Tentar de novo'));
    expect(await screen.findByText('Cartão')).toBeTruthy();
  });

  it('validates and creates a debt', async () => {
    api.getAll.mockResolvedValue([]);
    api.create.mockResolvedValue(card);
    const { client } = renderScreen();
    const invalidate = jest.spyOn(client, 'invalidateQueries');

    fireEvent.click(await screen.findByText('Nova dívida'));
    expect(screen.getAllByText('Nova dívida').length).toBe(2);
    fireEvent.click(screen.getByText('Salvar'));
    expect(screen.getByText(DEBT_NAME_REQUIRED)).toBeTruthy();

    fireEvent.change(inputOf('Nome:'), { target: { value: ' Cartão ' } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(screen.getByText(INVALID_AMOUNT_MESSAGE)).toBeTruthy();

    fireEvent.change(inputOf('Saldo devedor:'), { target: { value: '3.500,00' } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(screen.getByText(DEBT_RATE_INVALID)).toBeTruthy();

    fireEvent.change(inputOf('Juros (% ao mês):'), { target: { value: '2,5' } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(screen.getByText(DEBT_MINIMUM_INVALID)).toBeTruthy();

    fireEvent.change(inputOf('Parcela mínima:'), { target: { value: '200' } });
    fireEvent.click(screen.getByText('Salvar'));
    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({ name: 'Cartão', balanceCents: 350000, monthlyRatePercent: 2.5, minimumPaymentCents: 20000 })
    );
    await waitFor(() => expect(screen.queryByText('Salvar')).toBeNull());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['debts'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['summary'] });
  });

  it('edits a debt with its current values', async () => {
    api.getAll.mockResolvedValue([card]);
    api.update.mockResolvedValue(card);
    renderScreen();

    fireEvent.click(await screen.findByText('Editar'));
    expect(screen.getByText('Editar dívida')).toBeTruthy();
    expect(inputOf('Nome:').value).toBe('Cartão');
    expect(inputOf('Saldo devedor:').value).toBe('3.500,00');
    expect(inputOf('Juros (% ao mês):').value).toBe('12,5');
    expect(inputOf('Parcela mínima:').value).toBe('200,00');

    fireEvent.change(inputOf('Juros (% ao mês):'), { target: { value: '9' } });
    fireEvent.click(screen.getByText('Salvar'));
    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('d1', { name: 'Cartão', balanceCents: 350000, monthlyRatePercent: 9, minimumPaymentCents: 20000 })
    );
  });

  it('alerts when saving fails and closes on cancel', async () => {
    api.getAll.mockResolvedValue([card]);
    api.update.mockRejectedValueOnce(apiError('Juros muito altos')).mockRejectedValueOnce(new Error('x'));
    renderScreen();

    fireEvent.click(await screen.findByText('Editar'));
    fireEvent.click(screen.getByText('Salvar'));
    expect(await screen.findByText('Juros muito altos')).toBeTruthy();
    fireEvent.click(screen.getByText('OK'));

    fireEvent.click(screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Salvar'));
    expect(await screen.findByText('Não foi possível salvar a dívida')).toBeTruthy();
    fireEvent.click(screen.getByText('OK'));

    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Salvar')).toBeNull());
  });

  it('removes a debt after confirmation', async () => {
    api.getAll.mockResolvedValue([card]);
    api.remove.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.click(await screen.findByText('Remover'));
    expect(screen.getByText('Deseja remover a dívida "Cartão"?')).toBeTruthy();
    fireEvent.click(screen.getAllByText('Remover')[1]);
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('d1'));
  });

  it('does not remove when cancelled and alerts when removal fails', async () => {
    api.getAll.mockResolvedValue([card]);
    api.remove.mockRejectedValue(new Error('x'));
    renderScreen();

    fireEvent.click(await screen.findByText('Remover'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText(/Deseja remover/)).toBeNull());
    expect(api.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Remover'));
    fireEvent.click(screen.getAllByText('Remover')[1]);
    expect(await screen.findByText('Não foi possível remover a dívida')).toBeTruthy();
  });
});
