import '@/features/spending/__tests__/matchMedia';
import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { accountsApi } from '@/features/accounts/api';
import { categoriesApi } from '@/features/categories/api';
import { merchantsApi } from '@/features/merchants/api';
import { MerchantDto, MerchantHistoryDto } from '@/features/merchants/types';
import { transactionsApi } from '@/features/transactions/api';
import { formatCents } from '@/lib/money';
import { monthKeyOf, monthLabel, monthRange, twelveMonthsUntil } from '@/lib/periods';
import { AvoidableScreen, formatRate } from '../AvoidableScreen';
import { avoidableApi } from '../api';
import { emptyReport, fullReport } from './fixtures';

jest.mock('../api');
jest.mock('@/features/accounts/api');
jest.mock('@/features/categories/api');
jest.mock('@/features/merchants/api');
jest.mock('@/features/transactions/api');

const api = jest.mocked(avoidableApi);
const merchants = jest.mocked(merchantsApi);
const now = new Date();
const currentKey = monthKeyOf(now);
const previousKey = monthKeyOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));
const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');
const day = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

const netflix: MerchantDto = {
  id: 'm1',
  name: 'Netflix',
  kind: 'BUSINESS',
  document: null,
  categoryId: 'c1',
  categoryName: 'Lazer',
  class: null,
  activity: null,
};

const history: MerchantHistoryDto = {
  merchant: netflix,
  months: [{ monthStart: '2026-10-01T03:00:00Z', expenseCents: 5990, incomeCents: 0, count: 1 }],
  expenseCents: 5990,
  incomeCents: 0,
  count: 1,
  averageMonthlyCents: 5990,
  averageTicketCents: 5990,
};

const apiError = (message: string) => ({ isAxiosError: true, response: { status: 400, data: { message } } });

function renderScreen() {
  return renderWithProviders(<AvoidableScreen />, { windowId: '/avoidable' });
}

function rowOf(name: string) {
  return screen.getByText(name).parentElement!.parentElement as HTMLElement;
}

function selectAfter(label: string) {
  return screen.getByText(label).parentElement!.querySelector('select')!;
}

beforeEach(() => {
  api.get.mockResolvedValue(fullReport);
  merchants.history.mockResolvedValue(history);
  merchants.setClass.mockResolvedValue({ ...netflix, class: 'ESSENTIAL' });
  merchants.update.mockResolvedValue({ merchant: netflix, updatedTransactions: 0 });
  jest.mocked(transactionsApi.getAll).mockResolvedValue([]);
  jest.mocked(accountsApi.getAll).mockResolvedValue([{ id: 'a1', name: 'Nubank', balanceCents: 0, createdAt: '' }]);
  jest.mocked(categoriesApi.getAll).mockResolvedValue([{ id: 'c1', name: 'Lazer', type: 'EXPENSE', color: '#000' }]);
});

describe('formatRate', () => {
  it('formats a percentage the Brazilian way', () => {
    expect(formatRate(14.9)).toBe('14,9%');
    expect(formatRate(10.123)).toBe('10,12%');
  });
});

describe('AvoidableScreen', () => {
  it('shows the totals of the current month', async () => {
    renderScreen();

    expect(screen.getByText('Analisando...')).toBeTruthy();
    await waitFor(() => expect(screen.getByText(`Gastos evitáveis de ${monthLabel(currentKey)}`)).toBeTruthy());
    expect(api.get).toHaveBeenCalledWith({ ...monthRange(currentKey), accountId: undefined });
    expect(screen.getByText('Evitável neste mês')).toBeTruthy();
    expect(screen.getByText(money(45000))).toBeTruthy();
    expect(screen.getByText('Em 12 meses')).toBeTruthy();
    expect(screen.getByText(money(480000))).toBeTruthy();
    expect(screen.getByText(`no ritmo médio de ${money(40000)} por mês`)).toBeTruthy();
    expect(screen.getByText('Se investisse')).toBeTruthy();
    expect(screen.getByText(money(515000))).toBeTruthy();
    expect(screen.getByText('em 12 meses a 100% do CDI (14,9% ao ano)')).toBeTruthy();
    expect(screen.queryByText('Nenhum gasto evitável encontrado neste mês.')).toBeNull();
  });

  it('audits the subscriptions', async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByText('Assinaturas')).toBeTruthy());
    expect(
      screen.getByText(`2 serviços de streaming de vídeo ao mesmo tempo: Netflix, Disney+ — ${money(9380)} por mês.`)
    ).toBeTruthy();

    const netflixRow = rowOf('Netflix');
    expect(
      within(netflixRow).getByText(
        `streaming de vídeo · ${money(71880)} por ano · última cobrança em ${day('2026-10-05T12:00:00Z')} · investido: ${money(77000)} em 12 meses`
      )
    ).toBeTruthy();
    expect(
      within(netflixRow).getByText(
        `Preço subiu de ${money(5590)} para ${money(5990)} · Voltou a cobrar depois de uma pausa (cobrança anterior em ${day('2026-06-05T12:00:00Z')})`
      )
    ).toBeTruthy();
    expect(within(netflixRow).getByText(`${money(5990)}/mês`)).toBeTruthy();
    expect(within(netflixRow).getByText('Ver detalhes')).toBeTruthy();
    expect(within(netflixRow).getByText('Não é desnecessário')).toBeTruthy();

    const disneyRow = rowOf('Disney+');
    expect(
      within(disneyRow).getByText(
        `Voltou a cobrar depois de uma pausa (cobrança anterior em ${day('2026-07-08T12:00:00Z')})`
      )
    ).toBeTruthy();
    expect(within(disneyRow).queryByText(/Preço subiu/)).toBeNull();

    const gymRow = rowOf('Academia');
    expect(
      within(gymRow).getByText(
        `Assinatura · ${money(118800)} por ano · última cobrança em ${day('2026-10-02T12:00:00Z')} · investido: ${money(127000)} em 12 meses`
      )
    ).toBeTruthy();
    expect(within(gymRow).queryByText(/Preço subiu|Voltou a cobrar/)).toBeNull();
    expect(within(gymRow).queryByRole('button')).toBeNull();
  });

  it('lists the small purchases, the spikes, the first time purchases and the superfluous merchants', async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByText('Pequenos gastos que somam')).toBeTruthy());
    expect(screen.getByText(`${money(18000)} por mês em cerca de 12 compras abaixo de ${money(3000)}.`)).toBeTruthy();
    const bakery = rowOf('Padaria');
    expect(within(bakery).getByText(`8,5 vezes por mês · ticket médio de ${money(1400)}`)).toBeTruthy();
    expect(within(bakery).getByText(`${money(12000)}/mês`)).toBeTruthy();
    expect(within(bakery).getByText('Marcar como supérfluo')).toBeTruthy();
    expect(within(rowOf('Ambulante')).queryByRole('button')).toBeNull();

    expect(screen.getByText('Picos fora do normal')).toBeTruthy();
    const leisure = rowOf('Lazer');
    expect(within(leisure).getByText(`Categoria · média de ${money(20000)} por mês · normal até ${money(30000)}`)).toBeTruthy();
    expect(within(leisure).getByText('3x a média')).toBeTruthy();
    expect(within(leisure).queryByRole('button')).toBeNull();
    const bar = rowOf('Bar do Zé');
    expect(within(bar).getByText(`Estabelecimento · média de ${money(10000)} por mês · normal até ${money(15000)}`)).toBeTruthy();
    expect(within(bar).getByText('2,5x a média')).toBeTruthy();
    expect(within(bar).getByText('Ver detalhes')).toBeTruthy();
    expect(within(bar).queryByText('Marcar como supérfluo')).toBeNull();
    expect(within(bar).queryByText('Não é desnecessário')).toBeNull();
    expect(within(rowOf('Sem cadastro')).queryByRole('button')).toBeNull();

    expect(screen.getByText('Compras grandes pela primeira vez')).toBeTruthy();
    const store = rowOf('Magazine');
    expect(
      within(store).getByText(`${day('2026-10-12T12:00:00Z')} · nenhuma compra neste lugar nos 12 meses anteriores`)
    ).toBeTruthy();
    expect(within(store).getByText(money(150000))).toBeTruthy();
    expect(within(store).getByText('Marcar como supérfluo')).toBeTruthy();
    const jeweler = rowOf('Joalheria');
    expect(within(jeweler).getByText('Ver detalhes')).toBeTruthy();
    expect(within(jeweler).queryByText('Marcar como supérfluo')).toBeNull();
    expect(within(rowOf('Feira')).queryByRole('button')).toBeNull();

    expect(screen.getByText('Supérfluos por estabelecimento')).toBeTruthy();
    const shopee = rowOf('Shopee');
    expect(within(shopee).getByText(`Compras · 3 compra(s) · média de ${money(15000)} por mês`)).toBeTruthy();
    expect(
      within(shopee).getByText(`Cortando pela metade: ${money(10000)} por mês, ${money(125000)} investidos em 12 meses`)
    ).toBeTruthy();
    expect(within(shopee).getByText(money(20000))).toBeTruthy();
    expect(within(shopee).getByText('Não é desnecessário')).toBeTruthy();
    expect(within(rowOf('Loja avulsa')).queryByRole('button')).toBeNull();
  });

  it('shows the empty state and hides every section when nothing is avoidable', async () => {
    api.get.mockResolvedValue(emptyReport);
    renderScreen();

    await waitFor(() => expect(screen.getByText('Nenhum gasto evitável encontrado neste mês.')).toBeTruthy());
    expect(screen.queryByText('Assinaturas')).toBeNull();
    expect(screen.queryByText('Pequenos gastos que somam')).toBeNull();
    expect(screen.queryByText('Picos fora do normal')).toBeNull();
    expect(screen.queryByText('Compras grandes pela primeira vez')).toBeNull();
    expect(screen.queryByText('Supérfluos por estabelecimento')).toBeNull();
  });

  it('does not show the empty state while a single section has items', async () => {
    api.get.mockResolvedValue({ ...emptyReport, spikes: fullReport.spikes });
    renderScreen();

    await waitFor(() => expect(screen.getByText('Picos fora do normal')).toBeTruthy());
    expect(screen.queryByText('Nenhum gasto evitável encontrado neste mês.')).toBeNull();
  });

  it('filters by month and account', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Assinaturas')).toBeTruthy());

    fireEvent.change(selectAfter('Mês:'), { target: { value: previousKey } });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith({ ...monthRange(previousKey), accountId: undefined }));
    await waitFor(() => expect(screen.getByText(`Gastos evitáveis de ${monthLabel(previousKey)}`)).toBeTruthy());

    await waitFor(() => expect(selectAfter('Conta:').querySelectorAll('option')).toHaveLength(2));
    fireEvent.change(selectAfter('Conta:'), { target: { value: 'a1' } });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith({ ...monthRange(previousKey), accountId: 'a1' }));
  });

  it('shows the error state and retries', async () => {
    api.get.mockRejectedValueOnce(apiError('Serviço indisponível'));
    renderScreen();

    await waitFor(() => expect(screen.getByText('Serviço indisponível')).toBeTruthy());
    expect(screen.queryByText('Evitável neste mês')).toBeNull();
    fireEvent.click(screen.getByText('Tentar de novo'));

    await waitFor(() => expect(screen.getByText('Assinaturas')).toBeTruthy());
  });

  it('falls back to a generic error message', async () => {
    api.get.mockRejectedValueOnce(new Error('x'));
    renderScreen();

    await waitFor(() => expect(screen.getByText('Não foi possível carregar os gastos evitáveis')).toBeTruthy());
  });

  it('refreshes from the toolbar', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Assinaturas')).toBeTruthy());

    const toolbarButton = screen.getAllByRole('button').find((b) => within(b).queryByText('Atualizar'));
    fireEvent.click(toolbarButton!);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });

  it('marks a merchant as essential and refreshes the analysis', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Assinaturas')).toBeTruthy());

    fireEvent.click(within(rowOf('Netflix')).getByText('Não é desnecessário'));

    await waitFor(() =>
      expect(
        screen.getByText('Netflix foi marcado como essencial e não aparece mais como gasto evitável.')
      ).toBeTruthy()
    );
    expect(merchants.setClass).toHaveBeenCalledWith('m1', 'ESSENTIAL');
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });

  it('marks a merchant as superfluous', async () => {
    merchants.setClass.mockResolvedValue({ ...netflix, id: 'm6', class: 'SUPERFLUOUS' });
    renderScreen();
    await waitFor(() => expect(screen.getByText('Compras grandes pela primeira vez')).toBeTruthy());

    fireEvent.click(within(rowOf('Magazine')).getByText('Marcar como supérfluo'));

    await waitFor(() =>
      expect(screen.getByText('Magazine foi marcado como supérfluo e passa a contar como gasto evitável.')).toBeTruthy()
    );
    expect(merchants.setClass).toHaveBeenCalledWith('m6', 'SUPERFLUOUS');
  });

  it('alerts when classifying the merchant fails', async () => {
    merchants.setClass.mockRejectedValue(new Error('x'));
    renderScreen();
    await waitFor(() => expect(screen.getByText('Pequenos gastos que somam')).toBeTruthy());

    fireEvent.click(within(rowOf('Padaria')).getByText('Marcar como supérfluo'));

    await waitFor(() => expect(screen.getByText('Não foi possível classificar o estabelecimento')).toBeTruthy());
    expect(merchants.setClass).toHaveBeenCalledWith('m3', 'SUPERFLUOUS');
  });

  it('opens the merchant detail and edits it', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Assinaturas')).toBeTruthy());

    fireEvent.click(within(rowOf('Netflix')).getByText('Ver detalhes'));

    await waitFor(() => expect(screen.getByText('Gasto no período')).toBeTruthy());
    expect(merchants.history).toHaveBeenCalledWith('m1', twelveMonthsUntil(currentKey));
    expect(screen.getByText(`Gasto por mês, 12 meses até ${monthLabel(currentKey)}`)).toBeTruthy();

    fireEvent.click(screen.getByText('Editar...'));
    expect(screen.getByText('Editar estabelecimento')).toBeTruthy();
    fireEvent.change(selectAfter('Classificação do gasto:'), { target: { value: 'ESSENTIAL' } });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(merchants.update).toHaveBeenCalledWith('m1', {
        name: 'Netflix',
        kind: 'BUSINESS',
        categoryId: 'c1',
        applyToTransactions: true,
        class: 'ESSENTIAL',
      })
    );
    await waitFor(() => expect(screen.queryByText('Editar estabelecimento')).toBeNull());
  });

  it('alerts when saving the merchant fails and closes the dialogs', async () => {
    merchants.update.mockRejectedValue(new Error('x'));
    renderScreen();
    await waitFor(() => expect(screen.getByText('Supérfluos por estabelecimento')).toBeTruthy());

    fireEvent.click(within(rowOf('Shopee')).getByText('Ver detalhes'));
    fireEvent.click(await screen.findByText('Editar...'));
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => expect(screen.getByText('Não foi possível salvar o estabelecimento')).toBeTruthy());
    expect(merchants.history).toHaveBeenCalledWith('m4', twelveMonthsUntil(currentKey));
    fireEvent.click(screen.getByText('OK'));

    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Editar estabelecimento')).toBeNull());

    fireEvent.click(screen.getByText('Fechar'));
    await waitFor(() => expect(screen.queryByText('Gasto no período')).toBeNull());
  });
});
