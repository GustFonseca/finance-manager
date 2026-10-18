import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { AccountsScreen } from '../AccountsScreen';
import { accountsApi } from '../api';

jest.mock('../api');

const api = jest.mocked(accountsApi);
const nubank = { id: 'a1', name: 'Nubank', balanceCents: 150000, createdAt: '2026-01-01T00:00:00Z' };
const apiError = (message: string) => ({ isAxiosError: true, response: { status: 400, data: { message } } });

function inputOf(label: string) {
  return screen.getByText(label).parentElement!.querySelector('input')!;
}

function renderScreen() {
  return renderWithProviders(<AccountsScreen />, { windowId: '/accounts' });
}

describe('AccountsScreen', () => {
  it('shows the empty state', async () => {
    api.getAll.mockResolvedValue([]);
    renderScreen();
    await waitFor(() => expect(screen.getByText('Nenhuma conta')).toBeTruthy());
    expect(screen.getByText('0 conta(s)')).toBeTruthy();
  });

  it('lists accounts with their balance', async () => {
    api.getAll.mockResolvedValue([nubank]);
    renderScreen();
    await waitFor(() => expect(screen.getByText('Nubank')).toBeTruthy());
    expect(screen.getByText('1 conta(s)')).toBeTruthy();
    expect(screen.getByText(/1\.500,00/)).toBeTruthy();
  });

  it('creates an account and invalidates the money queries', async () => {
    api.getAll.mockResolvedValue([]);
    api.create.mockResolvedValue(nubank);
    const { client } = renderScreen();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    await waitFor(() => expect(screen.getByText('Nenhuma conta')).toBeTruthy());

    fireEvent.click(screen.getByText('Nova conta'));
    expect(screen.getByText('Nova Conta')).toBeTruthy();
    fireEvent.click(screen.getByText('Salvar'));
    expect(api.create).not.toHaveBeenCalled();

    fireEvent.change(inputOf('Nome:'), { target: { value: '  Nubank  ' } });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => expect(api.create).toHaveBeenCalledWith('Nubank'));
    await waitFor(() => expect(screen.queryByText('Nova Conta')).toBeNull());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['accounts'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['transactions'] });
  });

  it('cancels the form', async () => {
    api.getAll.mockResolvedValue([]);
    renderScreen();
    fireEvent.click(await screen.findByText('Nova conta'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Nova Conta')).toBeNull());
  });

  it('edits an account from the options menu', async () => {
    api.getAll.mockResolvedValue([nubank]);
    api.update.mockResolvedValue({ ...nubank, name: 'Inter' });
    renderScreen();

    fireEvent.click(await screen.findByText('Nubank'));
    fireEvent.click(screen.getByText('Editar'));
    expect(screen.getByText('Editar Conta')).toBeTruthy();
    expect(inputOf('Nome:').value).toBe('Nubank');

    fireEvent.change(inputOf('Nome:'), { target: { value: 'Inter' } });
    fireEvent.click(screen.getByText('Salvar'));
    await waitFor(() => expect(api.update).toHaveBeenCalledWith('a1', 'Inter'));
  });

  it('shows an alert when saving fails', async () => {
    api.getAll.mockResolvedValue([]);
    api.create.mockRejectedValue(apiError('Nome já existe'));
    renderScreen();

    fireEvent.click(await screen.findByText('Nova conta'));
    fireEvent.change(inputOf('Nome:'), { target: { value: 'Nubank' } });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => expect(screen.getByText('Nome já existe')).toBeTruthy());
    expect(screen.getByText('Erro')).toBeTruthy();
  });

  it('removes an account after confirmation', async () => {
    api.getAll.mockResolvedValue([nubank]);
    api.remove.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.click(await screen.findByText('Nubank'));
    fireEvent.click(screen.getByText('Remover'));
    expect(screen.getByText('Deseja remover "Nubank"?')).toBeTruthy();
    fireEvent.click(screen.getByText('Remover'));

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('a1'));
  });

  it('keeps the account when the removal is cancelled', async () => {
    api.getAll.mockResolvedValue([nubank]);
    renderScreen();

    fireEvent.click(await screen.findByText('Nubank'));
    fireEvent.click(screen.getByText('Remover'));
    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => expect(screen.queryByText('Deseja remover "Nubank"?')).toBeNull());
    expect(api.remove).not.toHaveBeenCalled();
  });

  it('shows the fallback message when the removal fails', async () => {
    api.getAll.mockResolvedValue([nubank]);
    api.remove.mockRejectedValue(new Error('boom'));
    renderScreen();

    fireEvent.click(await screen.findByText('Nubank'));
    fireEvent.click(screen.getByText('Remover'));
    fireEvent.click(screen.getByText('Remover'));

    await waitFor(() => expect(screen.getByText('Não foi possível remover')).toBeTruthy());
  });
});
