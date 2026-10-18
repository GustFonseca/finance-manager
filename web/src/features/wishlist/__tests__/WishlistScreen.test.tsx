import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { formatCents, INVALID_AMOUNT_MESSAGE } from '@/lib/money';
import { apiError } from '@/test/http';
import { renderWithProviders } from '@/test/render';
import { WishlistScreen } from '../WishlistScreen';
import { wishlistApi } from '../api';
import { WISH_NAME_REQUIRED } from '../components/WishForm';
import { formatMoment } from '../components/WishRow';
import { wish, wishlist } from './fixtures';

jest.mock('../api');

const api = jest.mocked(wishlistApi);
const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');

function inputOf(label: string) {
  return screen.getByText(label).parentElement!.querySelector('input')!;
}

function renderScreen() {
  return renderWithProviders(<WishlistScreen />, { windowId: '/wishlist' });
}

const waiting = wish();
const ready = wish({ id: 'w2', name: 'Tênis', priceCents: 2000, readyToDecide: true, link: 'https://loja.com/tenis' });
const gaveUp = wish({ id: 'w3', name: 'Jaqueta', status: 'GAVE_UP', decidedAt: new Date(2026, 9, 19, 9, 5).toISOString() });
const bought = wish({ id: 'w4', name: 'Livro', status: 'BOUGHT', decidedAt: null });

describe('formatMoment', () => {
  it('shows the day, month, hour and minute', () => {
    expect(formatMoment(new Date(2026, 0, 5, 7, 3).toISOString())).toBe('05/01 07:03');
  });
});

describe('WishlistScreen', () => {
  it('shows the empty state and the hints while nothing was decided', async () => {
    api.get.mockResolvedValue(wishlist({ items: [], waitingCents: 0 }));
    renderScreen();

    expect(screen.getByText('Atualizando...')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('0 desejo(s)')).toBeTruthy());
    expect(screen.getByText(/Nenhum desejo na lista/)).toBeTruthy();
    expect(screen.getByText('desista de um desejo para começar')).toBeTruthy();
    expect(screen.getByText('nenhum desejo esperando')).toBeTruthy();
    expect(screen.getByText(/espere 48 h/)).toBeTruthy();
  });

  it('groups the wishes by status with countdown, work hours and decisions', async () => {
    api.get.mockResolvedValue(wishlist({ items: [waiting, ready, gaveUp, bought], savedCents: 10000, waitingCents: 37000 }));
    renderScreen();

    await waitFor(() => expect(screen.getByText('4 desejo(s)')).toBeTruthy());
    expect(screen.getByText('Economizado ao desistir')).toBeTruthy();
    expect(screen.getByText('≈ 2 h de trabalho')).toBeTruthy();
    expect(screen.getByText('≈ 7,4 h de trabalho')).toBeTruthy();
    expect(screen.getAllByText('Em espera').length).toBe(2);
    expect(screen.getByText(`Decida a partir de ${formatMoment(waiting.decideAfter)}`)).toBeTruthy();
    expect(screen.getByText('A espera acabou: já pode decidir')).toBeTruthy();
    expect(screen.getByText(`Desistiu em ${formatMoment(gaveUp.decidedAt!)}`)).toBeTruthy();
    expect(screen.getByText('Comprado')).toBeTruthy();
    expect(screen.getAllByText('≈ 7 h de trabalho').length).toBe(3);
    expect(screen.getByText('≈ 24 min de trabalho')).toBeTruthy();
    expect(screen.getAllByText('Comprei').length).toBe(1);
    expect(screen.getAllByText('Desisti').length).toBe(2);
    expect(screen.getByText('Desisti de comprar')).toBeTruthy();
    expect(screen.getByText('Comprados')).toBeTruthy();
    expect(screen.getAllByText('Voltar para a espera').length).toBe(2);
  });

  it('hides the work hours when the hour value is unknown and opens links in a new tab', async () => {
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    api.get.mockResolvedValue(wishlist({ items: [ready], hourValueCents: 0 }));
    renderScreen();

    fireEvent.click(await screen.findByText('https://loja.com/tenis'));
    expect(open).toHaveBeenCalledWith('https://loja.com/tenis', '_blank', 'noopener,noreferrer');
    expect(screen.queryByText(/de trabalho/)).toBeNull();
    open.mockRestore();
  });

  it('shows an error that can be retried', async () => {
    api.get.mockRejectedValue(new Error('boom'));
    renderScreen();

    await waitFor(() => expect(screen.getByText('Não foi possível carregar a lista de espera')).toBeTruthy());
    api.get.mockResolvedValue(wishlist());
    fireEvent.click(screen.getByText('Tentar de novo'));
    await waitFor(() => expect(screen.getByText('Fone de ouvido')).toBeTruthy());
  });

  it('validates and adds a wish', async () => {
    api.get.mockResolvedValue(wishlist({ items: [] }));
    api.create.mockResolvedValue(waiting);
    const { client } = renderScreen();
    const invalidate = jest.spyOn(client, 'invalidateQueries');

    fireEvent.click(await screen.findByText('Novo desejo'));
    expect(screen.getByText(/fica 48 h em espera/)).toBeTruthy();
    fireEvent.click(screen.getByText('Adicionar'));
    expect(screen.getByText(WISH_NAME_REQUIRED)).toBeTruthy();

    fireEvent.change(inputOf('O que você quer comprar:'), { target: { value: '  Fone  ' } });
    fireEvent.click(screen.getByText('Adicionar'));
    expect(screen.getByText(INVALID_AMOUNT_MESSAGE)).toBeTruthy();

    fireEvent.change(inputOf('Preço:'), { target: { value: '350,00' } });
    fireEvent.click(screen.getByText('Adicionar'));
    await waitFor(() => expect(api.create).toHaveBeenCalledWith({ name: 'Fone', priceCents: 35000, link: null }));
    await waitFor(() => expect(screen.queryByText('Adicionar')).toBeNull());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['wishlist'] });
  });

  it('sends the link and alerts when adding fails', async () => {
    api.get.mockResolvedValue(wishlist({ items: [] }));
    api.create.mockRejectedValue(apiError('Link inválido'));
    renderScreen();

    fireEvent.click(await screen.findByText('Novo desejo'));
    fireEvent.change(inputOf('O que você quer comprar:'), { target: { value: 'Fone' } });
    fireEvent.change(inputOf('Preço:'), { target: { value: '10' } });
    fireEvent.change(inputOf('Link (opcional):'), { target: { value: ' ftp://x ' } });
    fireEvent.click(screen.getByText('Adicionar'));

    await waitFor(() => expect(screen.getByText('Link inválido')).toBeTruthy());
    expect(api.create).toHaveBeenCalledWith({ name: 'Fone', priceCents: 1000, link: 'ftp://x' });
  });

  it('falls back to a generic message when adding fails and closes on cancel', async () => {
    api.get.mockResolvedValue(wishlist({ items: [] }));
    api.create.mockRejectedValue(new Error('x'));
    renderScreen();

    fireEvent.click(await screen.findByText('Novo desejo'));
    fireEvent.change(inputOf('O que você quer comprar:'), { target: { value: 'Fone' } });
    fireEvent.change(inputOf('Preço:'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Adicionar'));
    await waitFor(() => expect(screen.getByText('Não foi possível adicionar o desejo')).toBeTruthy());
    fireEvent.click(screen.getByText('OK'));

    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Adicionar')).toBeNull());
  });

  it('records each decision', async () => {
    api.get.mockResolvedValue(wishlist({ items: [ready, gaveUp] }));
    api.decide.mockResolvedValue(ready);
    renderScreen();

    await screen.findByText('Tênis');
    fireEvent.click(screen.getByText('Desisti'));
    await waitFor(() => expect(api.decide).toHaveBeenCalledWith('w2', 'GAVE_UP'));
    fireEvent.click(screen.getByText('Comprei'));
    await waitFor(() => expect(api.decide).toHaveBeenCalledWith('w2', 'BOUGHT'));
    fireEvent.click(screen.getByText('Voltar para a espera'));
    await waitFor(() => expect(api.decide).toHaveBeenCalledWith('w3', 'WAITING'));
  });

  it.each([
    ['Desisti', 'Não foi possível registrar a desistência'],
    ['Comprei', 'Não foi possível registrar a compra'],
    ['Voltar para a espera', 'Não foi possível voltar o desejo para a espera'],
  ])('alerts when "%s" fails', async (label, message) => {
    api.get.mockResolvedValue(wishlist({ items: [ready, gaveUp] }));
    api.decide.mockRejectedValue(new Error('x'));
    renderScreen();

    await screen.findByText('Tênis');
    const buttons = screen.getAllByText(label);
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
  });

  it('shows the server reason when buying too early', async () => {
    api.get.mockResolvedValue(wishlist({ items: [ready] }));
    api.decide.mockRejectedValue(apiError('Ainda não passou o tempo de espera'));
    renderScreen();

    await screen.findByText('Tênis');
    fireEvent.click(screen.getByText('Comprei'));
    await waitFor(() => expect(screen.getByText('Ainda não passou o tempo de espera')).toBeTruthy());
  });

  it('removes a wish after confirmation', async () => {
    api.get.mockResolvedValue(wishlist());
    api.remove.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.click(await screen.findByText('Remover'));
    expect(screen.getByText('Deseja remover "Fone de ouvido" da lista de espera?')).toBeTruthy();
    fireEvent.click(screen.getAllByText('Remover')[1]);
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('w1'));
  });

  it('does not remove when cancelled and alerts when removal fails', async () => {
    api.get.mockResolvedValue(wishlist());
    api.remove.mockRejectedValue(new Error('x'));
    renderScreen();

    fireEvent.click(await screen.findByText('Remover'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText(/Deseja remover/)).toBeNull());
    expect(api.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Remover'));
    fireEvent.click(screen.getAllByText('Remover')[1]);
    await waitFor(() => expect(screen.getByText('Não foi possível remover o desejo')).toBeTruthy());
  });

  it('formats the totals as money', async () => {
    api.get.mockResolvedValue(wishlist({ savedCents: 12345 }));
    renderScreen();
    await waitFor(() => expect(screen.getAllByText(money(12345)).length).toBeGreaterThan(0));
  });
});
