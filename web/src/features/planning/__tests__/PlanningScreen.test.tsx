import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { goalsApi } from '@/features/goals/api';
import { GoalDto } from '@/features/goals/types';
import { formatCents } from '@/lib/money';
import { monthKeyOf, monthLabel, monthRange } from '@/lib/periods';
import { apiError } from '@/test/http';
import { renderWithProviders } from '@/test/render';
import { PlanningScreen } from '../PlanningScreen';
import { planningApi } from '../api';
import { monthsLeftText } from '../components/SeasonalCard';
import { emergency, netWorth, seasonal } from './fixtures';

jest.mock('../api');
jest.mock('@/features/goals/api');

const api = jest.mocked(planningApi);
const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');
const month = monthRange(monthKeyOf(new Date()));

const goal = (overrides: Partial<GoalDto>): GoalDto => ({
  id: 'g1',
  name: 'Reserva',
  targetCents: 100,
  currentCents: 0,
  deadline: null,
  status: 'ACTIVE',
  progressPercent: 0,
  ...overrides,
});

function selectOf(label: string) {
  return screen.getByText(label).parentElement!.querySelector('select')!;
}

function toolbarButton(label: string) {
  return screen.getAllByRole('button').find((b) => within(b).queryByText(label))!;
}

function textOf(element: HTMLElement) {
  return element.textContent!.replace(/\s+/g, ' ');
}

function renderScreen() {
  return renderWithProviders(<PlanningScreen />, { windowId: '/planning' });
}

beforeEach(() => {
  api.emergency.mockResolvedValue(emergency());
  api.seasonal.mockResolvedValue(seasonal());
  api.netWorth.mockResolvedValue(netWorth());
  api.setEmergency.mockResolvedValue(undefined);
  jest.mocked(goalsApi.getAll).mockResolvedValue([
    goal({}),
    goal({ id: 'g2', name: 'Viagem' }),
    goal({ id: 'g3', name: 'Antiga', status: 'CANCELLED' }),
  ]);
});

describe('monthsLeftText', () => {
  it('describes how long until the next bill', () => {
    expect(monthsLeftText(0)).toBe('vence este mês');
    expect(monthsLeftText(1)).toBe('falta 1 mês');
    expect(monthsLeftText(4)).toBe('faltam 4 meses');
  });
});

describe('PlanningScreen', () => {
  it('loads the three plans for the current month', async () => {
    renderScreen();

    expect(screen.getByText('Atualizando...')).toBeTruthy();
    await waitFor(() => expect(screen.getByText(`Planejamento de ${monthLabel(monthKeyOf(new Date()))}`)).toBeTruthy());
    expect(api.emergency).toHaveBeenCalledWith(month);
    expect(api.seasonal).toHaveBeenCalledWith(month);
    expect(api.netWorth).toHaveBeenCalledWith(month);
  });

  it('shows the emergency fund progress and forecast', async () => {
    renderScreen();

    expect(await screen.findByText(`6 meses dos seus gastos essenciais de ${money(300000)} por mês.`)).toBeTruthy();
    expect(screen.getByText('25% da reserva')).toBeTruthy();
    expect(screen.getByText('O valor guardado vem da meta "Reserva".')).toBeTruthy();
    expect(
      screen.getByText(`No ritmo atual (${money(50000)} guardados por mês), a reserva fica pronta em 27 meses.`)
    ).toBeTruthy();
    expect(selectOf('Meses de reserva:').value).toBe('6');
    await waitFor(() => expect(selectOf('Meta usada como reserva:').querySelectorAll('option')).toHaveLength(3));
    expect(selectOf('Meta usada como reserva:').value).toBe('g1');
    expect(selectOf('Meses de reserva:').querySelectorAll('option')).toHaveLength(24);
    expect(selectOf('Meses de reserva:').querySelector('option')!.textContent).toBe('1 mês');
  });

  it('explains when there is no goal or no saving pace', async () => {
    api.emergency.mockResolvedValue(emergency({ months: 1, goalId: null, goalName: null, monthsToReach: null }));
    renderScreen();

    expect(await screen.findByText('Escolha uma meta para acompanhar quanto já foi guardado.')).toBeTruthy();
    expect(screen.getByText('No ritmo atual não dá para prever quando a reserva fica pronta.')).toBeTruthy();
    expect(screen.getByText(/^1 mês dos seus gastos/)).toBeTruthy();
    expect(selectOf('Meta usada como reserva:').value).toBe('none');
  });

  it('celebrates a complete reserve', async () => {
    api.emergency.mockResolvedValue(emergency({ percent: 100, monthsToReach: 0 }));
    renderScreen();

    expect(await screen.findByText(/Reserva completa/)).toBeTruthy();
  });

  it('saves the months and the goal of the reserve', async () => {
    const { client } = renderScreen();
    const invalidate = jest.spyOn(client, 'invalidateQueries');

    await screen.findByText('25% da reserva');
    fireEvent.change(selectOf('Meses de reserva:'), { target: { value: '12' } });
    await waitFor(() => expect(api.setEmergency).toHaveBeenCalledWith({ months: 12, goalId: 'g1' }));
    await waitFor(() => expect(selectOf('Meta usada como reserva:').querySelectorAll('option')).toHaveLength(3));
    fireEvent.change(selectOf('Meta usada como reserva:'), { target: { value: 'g2' } });
    await waitFor(() => expect(api.setEmergency).toHaveBeenCalledWith({ months: 6, goalId: 'g2' }));
    fireEvent.change(selectOf('Meta usada como reserva:'), { target: { value: 'none' } });
    await waitFor(() => expect(api.setEmergency).toHaveBeenCalledWith({ months: 6, goalId: null }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['summary'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['savings'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['goals'] });
  });

  it('alerts when saving the reserve fails', async () => {
    api.setEmergency.mockRejectedValueOnce(apiError('Escolha de 1 a 24 meses')).mockRejectedValueOnce(new Error('x'));
    renderScreen();

    await screen.findByText('25% da reserva');
    fireEvent.change(selectOf('Meses de reserva:'), { target: { value: '24' } });
    expect(await screen.findByText('Escolha de 1 a 24 meses')).toBeTruthy();
    fireEvent.click(screen.getByText('OK'));
    fireEvent.change(selectOf('Meses de reserva:'), { target: { value: '3' } });
    expect(await screen.findByText('Não foi possível salvar a reserva de emergência')).toBeTruthy();
  });

  it('lists the seasonal bills and the monthly reserve', async () => {
    renderScreen();

    expect(await screen.findByText('IPVA · Detran')).toBeTruthy();
    const ipva = screen.getByText('IPVA · Detran').parentElement!;
    expect(textOf(ipva)).toContain(`Próxima em 15/01/2027 (faltam 3 meses) · última de ${money(240000)} em 15/01/2026`);
    expect(screen.getByText(`${money(30000)}/mês`)).toBeTruthy();
    expect(screen.getByText(/falta 1 mês/)).toBeTruthy();
    expect(screen.getByText('Guarde por mês para pagar tudo sem aperto:')).toBeTruthy();
    expect(screen.getByText(money(45000))).toBeTruthy();
  });

  it('says when there are no seasonal bills', async () => {
    api.seasonal.mockResolvedValue(seasonal({ items: [], monthlyReserveCents: 0 }));
    renderScreen();

    expect(await screen.findByText(/Nenhuma conta anual encontrada/)).toBeTruthy();
  });

  it('shows the net worth with accounts and history', async () => {
    renderScreen();

    expect(await screen.findByText('Em contas')).toBeTruthy();
    expect(screen.getByText(`- ${money(150000)}`)).toBeTruthy();
    expect(screen.getByText(money(350000))).toBeTruthy();
    expect(screen.getByText('Nubank')).toBeTruthy();
    expect(screen.getByText(`- ${money(20000)}`)).toBeTruthy();
    expect(screen.getByText('Saldo em contas nos últimos 12 meses')).toBeTruthy();
    expect(screen.getByLabelText(/set: .*- R\$ 100,00 em contas/)).toBeTruthy();
  });

  it('hides the chart without history', async () => {
    api.netWorth.mockResolvedValue(netWorth({ history: [] }));
    renderScreen();

    await screen.findByText('Em contas');
    expect(screen.queryByText('Saldo em contas nos últimos 12 meses')).toBeNull();
  });

  it('shows each error with its own retry', async () => {
    api.emergency.mockRejectedValue(new Error('a'));
    api.seasonal.mockRejectedValue(new Error('b'));
    api.netWorth.mockRejectedValue(new Error('c'));
    renderScreen();

    expect(await screen.findByText('Não foi possível carregar a reserva de emergência')).toBeTruthy();
    expect(await screen.findByText('Não foi possível carregar as contas sazonais')).toBeTruthy();
    expect(await screen.findByText('Não foi possível carregar o patrimônio')).toBeTruthy();

    api.emergency.mockResolvedValue(emergency());
    api.seasonal.mockResolvedValue(seasonal());
    api.netWorth.mockResolvedValue(netWorth());
    screen.getAllByText('Tentar de novo').forEach((button) => fireEvent.click(button));
    expect(await screen.findByText('25% da reserva')).toBeTruthy();
    expect(await screen.findByText('IPVA · Detran')).toBeTruthy();
    expect(await screen.findByText('Em contas')).toBeTruthy();
  });

  it('refreshes everything from the toolbar', async () => {
    renderScreen();

    await screen.findByText('25% da reserva');
    fireEvent.click(toolbarButton('Atualizar'));
    await waitFor(() => expect(api.emergency).toHaveBeenCalledTimes(2));
    expect(api.seasonal).toHaveBeenCalledTimes(2);
    expect(api.netWorth).toHaveBeenCalledTimes(2);
  });
});
