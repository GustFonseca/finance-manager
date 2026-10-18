import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { formatCents } from '@/lib/money';
import { renderWithProviders } from '@/test/render';
import { TAX_NOTE, TaxScreen } from '../TaxScreen';
import { taxApi } from '../api';
import { buildTaxSummary } from '../summary';
import { report } from './fixtures';

jest.mock('../api');

const api = jest.mocked(taxApi);
const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');
const lastYear = new Date().getFullYear() - 1;

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

function renderScreen() {
  return renderWithProviders(<TaxScreen />, { windowId: '/tax' });
}

afterEach(() => setClipboard(undefined));

describe('TaxScreen', () => {
  it('opens on last year with the totals, sources and deductions', async () => {
    api.report.mockResolvedValue(report());
    renderScreen();

    expect(screen.getByText('Atualizando...')).toBeTruthy();
    expect(api.report).toHaveBeenCalledWith(lastYear);
    await waitFor(() => expect(screen.getByText(`Ano-calendário ${lastYear}`)).toBeTruthy());
    expect(screen.getByText(money(7800000))).toBeTruthy();
    expect(screen.getByText(money(5400000))).toBeTruthy();
    expect(screen.getByText(money(650000))).toBeTruthy();
    expect(screen.getByText(TAX_NOTE)).toBeTruthy();
    expect(screen.getByText('Empresa X')).toBeTruthy();
    expect(screen.getByText('CNPJ 12.345.678/0001-90 · 12 lançamento(s)')).toBeTruthy();
    expect(screen.getByText('documento não identificado · 2 lançamento(s)')).toBeTruthy();
    expect(screen.getByText('Saúde')).toBeTruthy();
    expect(screen.getByText('CPF 123.456.789-01 · 6 lançamento(s)')).toBeTruthy();
    expect(screen.getByText('Educação')).toBeTruthy();
  });

  it('changes the year', async () => {
    api.report.mockResolvedValue(report());
    renderScreen();

    await screen.findByText('Empresa X');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: String(lastYear - 1) } });
    await waitFor(() => expect(api.report).toHaveBeenCalledWith(lastYear - 1));
  });

  it('says when nothing was found', async () => {
    api.report.mockResolvedValue(report({ incomes: [], deductibles: [] }));
    renderScreen();

    expect(await screen.findByText('Nenhum rendimento encontrado em 2025.')).toBeTruthy();
    expect(screen.getByText('Nenhuma despesa dedutível encontrada em 2025.')).toBeTruthy();
  });

  it('shows an error that can be retried', async () => {
    api.report.mockRejectedValue(new Error('x'));
    renderScreen();

    expect(await screen.findByText('Não foi possível montar o resumo do Imposto de Renda')).toBeTruthy();
    expect(screen.queryByText('Copiar resumo')).toBeNull();
    api.report.mockResolvedValue(report());
    fireEvent.click(screen.getByText('Tentar de novo'));
    expect(await screen.findByText('Empresa X')).toBeTruthy();
  });

  it('copies the summary to the clipboard', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    api.report.mockResolvedValue(report());
    renderScreen();

    fireEvent.click(await screen.findByText('Copiar resumo'));
    expect(await screen.findByText(/Resumo copiado/)).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith(buildTaxSummary(report()));
  });

  it('alerts when the clipboard is missing or refuses', async () => {
    api.report.mockResolvedValue(report());
    renderScreen();

    fireEvent.click(await screen.findByText('Copiar resumo'));
    expect(await screen.findByText(/Não foi possível copiar o resumo/)).toBeTruthy();
    fireEvent.click(screen.getByText('OK'));

    setClipboard({ writeText: jest.fn().mockRejectedValue(new Error('denied')) });
    fireEvent.click(screen.getByText('Copiar resumo'));
    expect(await screen.findByText(/Não foi possível copiar o resumo/)).toBeTruthy();
  });
});
