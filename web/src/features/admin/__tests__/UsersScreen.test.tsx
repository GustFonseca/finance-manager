import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { apiError } from '@/test/http';
import { adminApi } from '../api';
import { UsersScreen } from '../UsersScreen';
import { users } from './fixtures';

jest.mock('../api');

const api = jest.mocked(adminApi);

function renderScreen() {
  return renderWithProviders(<UsersScreen />, { windowId: '/users' });
}

function tile(label: string) {
  return screen.getByText(label).parentElement!.textContent;
}

beforeEach(() => {
  api.getUsers.mockResolvedValue(users);
});

describe('UsersScreen', () => {
  it('shows the totals and each user activity', async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByText('2 de 2 usuário(s)')).toBeTruthy());
    expect(tile('Cadastrados')).toBe('Cadastrados2');
    expect(tile('Ativos nos últimos 7 dias')).toBe('Ativos nos últimos 7 dias1');
    expect(tile('Logins no total')).toBe('Logins no total7');
    expect(screen.getByText('ana@x.com')).toBeTruthy();
    expect(screen.getAllByText('Cadastro em 01/09/2026, 10:00')).toHaveLength(2);
    expect(screen.getByText('Último login: 18/10/2026, 20:15')).toBeTruthy();
    expect(screen.getByText('Último acesso: 19/10/2026, 08:00')).toBeTruthy();
    expect(screen.getByText('5 login(s) · 42 transação(ões)')).toBeTruthy();
    expect(screen.getAllByText('ativo')).toHaveLength(1);
    expect(screen.getByText('Último login: nunca')).toBeTruthy();
    expect(screen.getByText('Último acesso: nunca')).toBeTruthy();
  });

  it('searches by name or e-mail and selects a row', async () => {
    renderScreen();
    await screen.findByText('Bruno');

    fireEvent.change(screen.getByLabelText('Procurar usuários'), { target: { value: 'BRUNO@' } });
    expect(screen.queryByText('Ana')).toBeNull();
    expect(screen.getByText('1 de 2 usuário(s)')).toBeTruthy();
    fireEvent.click(screen.getByText('Bruno'));
    expect(screen.getByText('Bruno')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Procurar usuários'), { target: { value: 'ninguem' } });
    expect(screen.getByText('Nenhum usuário encontrado.')).toBeTruthy();
  });

  it('says when there are no users', async () => {
    api.getUsers.mockResolvedValue([]);
    renderScreen();

    expect(await screen.findByText('Nenhum usuário cadastrado.')).toBeTruthy();
  });

  it('shows the error state and retries', async () => {
    api.getUsers.mockRejectedValueOnce(apiError('Acesso negado', 403));
    renderScreen();

    await waitFor(() => expect(screen.getByText('Acesso negado')).toBeTruthy());
    expect(screen.queryByLabelText('Procurar usuários')).toBeNull();
    fireEvent.click(screen.getByText('Tentar de novo'));

    await waitFor(() => expect(screen.getByText('2 de 2 usuário(s)')).toBeTruthy());
  });
});
