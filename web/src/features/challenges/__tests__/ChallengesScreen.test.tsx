import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { categoriesApi } from '@/features/categories/api';
import { merchantsApi } from '@/features/merchants/api';
import { formatCents } from '@/lib/money';
import { renderWithProviders } from '@/test/render';
import { ChallengesScreen } from '../ChallengesScreen';
import { challengesApi } from '../api';
import { challenge } from './fixtures';
import { apiError } from '@/test/http';

jest.mock('../api');
jest.mock('@/features/categories/api');
jest.mock('@/features/merchants/api');

const api = jest.mocked(challengesApi);
const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');

const active = challenge();
const won = challenge({ id: 'ch2', name: 'Semana sem bar', status: 'WON', savedCents: 5000 });
const lost = challenge({ id: 'ch3', name: 'Sem Shopee', status: 'LOST', savedCents: 7000 });

function inputOf(label: string) {
  return screen.getByText(label).parentElement!.querySelector('input')!;
}

function renderScreen() {
  return renderWithProviders(<ChallengesScreen />, { windowId: '/challenges' });
}

beforeEach(() => {
  jest.mocked(categoriesApi.getAll).mockResolvedValue([]);
  jest.mocked(merchantsApi.getAll).mockResolvedValue([]);
});

describe('ChallengesScreen', () => {
  it('shows the empty state', async () => {
    api.getAll.mockResolvedValue([]);
    renderScreen();

    expect(screen.getByText('Atualizando...')).toBeTruthy();
    await waitFor(() => expect(screen.getByText(`0 desafio(s) · ${money(0)} economizados`)).toBeTruthy());
    expect(screen.getByText(/Nenhum desafio ainda/)).toBeTruthy();
  });

  it('lists the challenges and sums the savings of those not lost', async () => {
    api.getAll.mockResolvedValue([active, won, lost]);
    renderScreen();

    await waitFor(() => expect(screen.getByText('30 dias sem delivery')).toBeTruthy());
    expect(screen.getByText('Semana sem bar')).toBeTruthy();
    expect(screen.getByText('Sem Shopee')).toBeTruthy();
    expect(screen.getByText(`3 desafio(s) · ${money(25000)} economizados`)).toBeTruthy();
  });

  it('shows an error that can be retried', async () => {
    api.getAll.mockRejectedValue(new Error('boom'));
    renderScreen();

    await waitFor(() => expect(screen.getByText('Não foi possível carregar os desafios')).toBeTruthy());
    api.getAll.mockResolvedValue([active]);
    fireEvent.click(screen.getByText('Tentar de novo'));
    await waitFor(() => expect(screen.getByText('30 dias sem delivery')).toBeTruthy());
  });

  it('creates a challenge and refreshes the list', async () => {
    api.getAll.mockResolvedValue([]);
    api.create.mockResolvedValue(active);
    const { client } = renderScreen();
    const invalidate = jest.spyOn(client, 'invalidateQueries');

    fireEvent.click(await screen.findByText('Novo desafio'));
    fireEvent.change(inputOf('Nome do desafio:'), { target: { value: 'Semana sem supérfluos' } });
    fireEvent.click(screen.getByText('Começar'));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Semana sem supérfluos', scope: 'SUPERFLUOUS' }))
    );
    await waitFor(() => expect(screen.queryByText('Começar')).toBeNull());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['challenges'] });
  });

  it('closes the new challenge form on cancel', async () => {
    api.getAll.mockResolvedValue([]);
    renderScreen();

    fireEvent.click(await screen.findByText('Novo desafio'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Começar')).toBeNull());
  });

  it('alerts when creating fails', async () => {
    api.getAll.mockResolvedValue([]);
    api.create.mockRejectedValue(apiError('Já existe um desafio ativo'));
    renderScreen();

    fireEvent.click(await screen.findByText('Novo desafio'));
    fireEvent.change(inputOf('Nome do desafio:'), { target: { value: 'Sem delivery' } });
    fireEvent.click(screen.getByText('Começar'));

    await waitFor(() => expect(screen.getByText('Já existe um desafio ativo')).toBeTruthy());
  });

  it('falls back to a generic message when creating fails', async () => {
    api.getAll.mockResolvedValue([]);
    api.create.mockRejectedValue(new Error('x'));
    renderScreen();

    fireEvent.click(await screen.findByText('Novo desafio'));
    fireEvent.change(inputOf('Nome do desafio:'), { target: { value: 'Sem delivery' } });
    fireEvent.click(screen.getByText('Começar'));

    await waitFor(() => expect(screen.getByText('Não foi possível criar o desafio')).toBeTruthy());
  });

  it('removes a challenge after confirmation', async () => {
    api.getAll.mockResolvedValue([active]);
    api.remove.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.click(await screen.findByText('Remover'));
    expect(screen.getByText('Deseja remover o desafio "30 dias sem delivery"?')).toBeTruthy();
    fireEvent.click(screen.getAllByText('Remover')[1]);

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('ch1'));
  });

  it('does not remove when cancelled and alerts when removal fails', async () => {
    api.getAll.mockResolvedValue([active]);
    api.remove.mockRejectedValue(new Error('x'));
    renderScreen();

    fireEvent.click(await screen.findByText('Remover'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Deseja remover o desafio "30 dias sem delivery"?')).toBeNull());
    expect(api.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Remover'));
    fireEvent.click(screen.getAllByText('Remover')[1]);
    await waitFor(() => expect(screen.getByText('Não foi possível remover o desafio')).toBeTruthy());
  });
});
