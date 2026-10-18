import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { hover } from '@/components/ui/__tests__/pointer';
import { formatCents } from '@/lib/money';
import { monthKeyOf, monthLabel, monthRange } from '@/lib/periods';
import { renderWithProviders } from '@/test/render';
import { CalendarScreen } from '../CalendarScreen';
import { calendarApi } from '../api';
import { CalendarDayDto } from '../types';

jest.mock('../api');

const api = jest.mocked(calendarApi);
const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');
const now = new Date();
const currentKey = monthKeyOf(now);
const previousKey = monthKeyOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));
const today = now.getDate();
const otherDay = today === 1 ? 2 : 1;

const dayOf = (day: number, overrides: Partial<CalendarDayDto> = {}): CalendarDayDto => ({
  date: new Date(Date.UTC(now.getFullYear(), now.getMonth(), day)).toISOString(),
  incomeCents: 0,
  expenseCents: 0,
  expectedInCents: 0,
  expectedOutCents: 0,
  items: [],
  ...overrides,
});

const busy = dayOf(today, {
  incomeCents: 650000,
  expenseCents: 4590,
  expectedInCents: 30000,
  expectedOutCents: 12000,
  items: [
    { kind: 'INCOME', name: 'Salário', amountCents: 650000 },
    { kind: 'EXPENSE', name: 'iFood', amountCents: 4590 },
    { kind: 'EXPECTED_INCOME', name: 'Freela', amountCents: 30000 },
    { kind: 'EXPECTED_BILL', name: 'Luz', amountCents: 8000 },
    { kind: 'EXPECTED_INSTALLMENT', name: 'Geladeira 3/10', amountCents: 4000 },
    { kind: 'SEASONAL', name: 'IPVA', amountCents: 1 },
  ],
});
const quiet = dayOf(otherDay);

function renderScreen() {
  return renderWithProviders(<CalendarScreen />, { windowId: '/calendar' });
}

describe('CalendarScreen', () => {
  it('draws the month with weekday headers, totals and each day', async () => {
    api.get.mockResolvedValue({ monthStart: '', days: [busy, quiet] });
    renderScreen();

    expect(screen.getByText('Atualizando...')).toBeTruthy();
    await waitFor(() => expect(screen.getByText(`Calendário de ${monthLabel(currentKey)}`)).toBeTruthy());
    expect(api.get).toHaveBeenCalledWith(monthRange(currentKey));
    for (const weekday of ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']) expect(screen.getByText(weekday)).toBeTruthy();
    const length = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    expect(screen.getByText(String(length))).toBeTruthy();
    expect(screen.getByText('-R$ 46')).toBeTruthy();
    expect(screen.getByText('+R$ 6,5 mil')).toBeTruthy();
    expect(screen.getByText('prev. -R$ 120')).toBeTruthy();
    expect(screen.getByText('prev. +R$ 300')).toBeTruthy();
    expect(screen.getAllByLabelText('Parcela prevista')).toHaveLength(1);
    expect(screen.getAllByText('Conta sazonal')).toHaveLength(1);
    expect(screen.getByText(money(650000))).toBeTruthy();
    expect(screen.getByText(money(4590))).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^Dia / })).toHaveLength(2);
  });

  it('opens the detail of a day and closes it', async () => {
    api.get.mockResolvedValue({ monthStart: '', days: [busy, quiet] });
    renderScreen();

    const button = await screen.findByRole('button', { name: `Dia ${today}` });
    hover(button);
    fireEvent.click(button);
    expect(screen.getByText('Salário')).toBeTruthy();
    expect(screen.getByText(`+ ${money(650000)}`)).toBeTruthy();
    expect(screen.getByText(`- ${money(4590)}`)).toBeTruthy();
    expect(screen.getByText(`- ${money(4000)}`)).toBeTruthy();
    expect(screen.getAllByText('Receita prevista')).toHaveLength(2);
    fireEvent.click(screen.getByText('Fechar'));
    await waitFor(() => expect(screen.queryByText('Salário')).toBeNull());

    fireEvent.click(screen.getByRole('button', { name: `Dia ${otherDay}` }));
    expect(screen.getByText('Nada registrado ou previsto neste dia.')).toBeTruthy();
  });

  it('changes the month', async () => {
    api.get.mockResolvedValue({ monthStart: '', days: [] });
    renderScreen();

    await screen.findByText(`Calendário de ${monthLabel(currentKey)}`);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: previousKey } });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(monthRange(previousKey)));
    expect(screen.queryAllByRole('button', { name: /^Dia / })).toHaveLength(0);
  });

  it('shows an error that can be retried', async () => {
    api.get.mockRejectedValue(new Error('x'));
    renderScreen();

    expect(await screen.findByText('Não foi possível carregar o calendário')).toBeTruthy();
    api.get.mockResolvedValue({ monthStart: '', days: [busy] });
    fireEvent.click(screen.getByText('Tentar de novo'));
    expect(await screen.findByRole('button', { name: `Dia ${today}` })).toBeTruthy();
  });
});
