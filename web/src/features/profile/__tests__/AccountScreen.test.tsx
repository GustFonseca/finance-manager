import React from 'react';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { hover, unhover } from '@/components/xp/__tests__/helpers';
import { renderWithProviders } from '@/test/render';
import { apiError } from '@/test/http';
import { AccountScreen } from '../AccountScreen';
import { profileApi } from '../api';
import { MESSAGES } from '../form';
import { ProfileDto } from '../types';
import { profile, profileUpdate } from './fixtures';

jest.mock('../api');

function toolbar(label: string) {
  return screen.getAllByRole('button').find((b) => within(b).queryByText(label) && b.textContent === label)!;
}

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

function type(label: string, value: string) {
  fireEvent.change(field(label), { target: { value } });
}

async function renderScreen() {
  const utils = renderWithProviders(<AccountScreen />, { windowId: '/account' });
  await screen.findByText('Dados pessoais');
  return utils;
}

async function save() {
  fireEvent.click(toolbar('Salvar'));
  await waitFor(() => expect(screen.getByText('Dados salvos')).toBeTruthy());
}

function avatar() {
  return screen.getAllByLabelText(/^Avatar de /)[0];
}

beforeEach(() => {
  jest.mocked(profileApi.get).mockResolvedValue(profile());
  jest.mocked(profileApi.update).mockImplementation(async (request) => ({ ...profile(), ...request }) as ProfileDto);
});

describe('AccountScreen', () => {
  it('shows the account data with the read-only Google e-mail', async () => {
    renderWithProviders(<AccountScreen />, { windowId: '/account' });

    expect(screen.getByText('Carregando...')).toBeTruthy();
    expect(screen.queryByText('Salvar')).toBeNull();
    await screen.findByText('Dados pessoais');

    expect(screen.getByText('Minha conta')).toBeTruthy();
    expect(screen.getByText('g@x.com')).toBeTruthy();
    expect(field('Nome').value).toBe('Gustavo');
    expect(field('E-mail').value).toBe('g@x.com');
    expect(field('E-mail').readOnly).toBe(true);
    expect(screen.getByText('vem da sua conta Google')).toBeTruthy();
    for (const title of ['Ícone', 'Informações financeiras', 'Preferências']) {
      expect(screen.getByText(title)).toBeTruthy();
    }
    expect(screen.getByText(/ajudar nas previsões e no Imposto de Renda/)).toBeTruthy();
    expect(screen.getByRole('checkbox')).toBeTruthy();
    expect(screen.getByText('Receber um resumo semanal por e-mail (em breve)')).toBeTruthy();
    expect(screen.getByText('Membro desde março de 2026')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^Ícone / }).length).toBeGreaterThanOrEqual(30);
    expect(within(avatar()).getByText('G')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Usar a letra' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('shows the load error and retries', async () => {
    jest.mocked(profileApi.get).mockRejectedValueOnce(apiError('Servidor fora do ar'));
    renderWithProviders(<AccountScreen />, { windowId: '/account' });

    expect(await screen.findByText('Servidor fora do ar')).toBeTruthy();
    expect(screen.queryByText('Salvar')).toBeNull();
    fireEvent.click(screen.getByText('Tentar de novo'));
    expect(await screen.findByText('Dados pessoais')).toBeTruthy();
    expect(profileApi.get).toHaveBeenCalledTimes(2);
  });

  it('picks an icon and a color and saves them', async () => {
    const { client } = await renderScreen();

    hover(screen.getByRole('button', { name: 'Ícone rocket' }));
    unhover(screen.getByRole('button', { name: 'Ícone rocket' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ícone rocket' }));
    fireEvent.click(screen.getByLabelText('Cor #357263'));

    expect(screen.getByRole('button', { name: 'Ícone rocket' }).getAttribute('aria-selected')).toBe('true');
    expect(within(avatar()).getByTestId('icon-rocket')).toBeTruthy();
    await save();

    expect(profileApi.update).toHaveBeenCalledWith(profileUpdate({ avatarIcon: 'rocket', avatarColor: '#357263' }));
    expect(screen.getByText('Suas informações foram atualizadas.')).toBeTruthy();
    expect(client.getQueryData<ProfileDto>(['profile'])?.avatarIcon).toBe('rocket');
  });

  it('goes back to the letter avatar', async () => {
    jest.mocked(profileApi.get).mockResolvedValue(profile({ avatarIcon: 'paw', avatarColor: '#9A6A8E' }));
    await renderScreen();
    expect(within(avatar()).getByTestId('icon-paw')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Usar a letra' }));

    expect(within(avatar()).getByText('G')).toBeTruthy();
    await save();
    expect(profileApi.update).toHaveBeenCalledWith(profileUpdate({ avatarIcon: null, avatarColor: '#9A6A8E' }));
  });

  it('saves every personal, financial and preference field', async () => {
    await renderScreen();

    type('Nome', 'Gustavo Fonseca');
    fireEvent.change(screen.getByLabelText('Data de nascimento'), { target: { value: '1990-05-10' } });
    type('Telefone', '11912345678');
    expect(field('Telefone').value).toBe('(11) 91234-5678');
    type('Cidade', 'Campinas');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'SP' } });
    type('Profissão', 'Desenvolvedor');
    type('Renda mensal líquida (R$)', '3.500,00');
    type('Dia em que recebe', '5');
    type('Pessoas que dependem de você', '2');
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('Gustavo Fonseca')).toBeTruthy();

    await save();

    expect(profileApi.update).toHaveBeenCalledWith({
      name: 'Gustavo Fonseca',
      avatarIcon: null,
      avatarColor: null,
      birthDate: '1990-05-10',
      phone: '11912345678',
      city: 'Campinas',
      state: 'SP',
      occupation: 'Desenvolvedor',
      monthlyIncomeCents: 350000,
      payday: 5,
      dependents: 2,
      digestByEmail: true,
    });
  });

  it('lists every state with an option to not inform it', async () => {
    jest.mocked(profileApi.get).mockResolvedValue(profile({ state: 'RJ' }));
    await renderScreen();

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('RJ');
    expect(select.options).toHaveLength(28);
    expect(select.options[0].textContent).toBe('Não informar');
    expect(within(select).getByText('SP — São Paulo')).toBeTruthy();

    fireEvent.change(select, { target: { value: '' } });
    await save();
    expect(profileApi.update).toHaveBeenCalledWith(profileUpdate({ state: null }));
  });

  it('points out invalid fields before saving', async () => {
    await renderScreen();

    type('Nome', '  ');
    expect(screen.getByText('Usuário')).toBeTruthy();
    fireEvent.click(toolbar('Salvar'));
    expect(screen.getByRole('alert').textContent).toBe(MESSAGES.name);

    type('Nome', 'Gustavo');
    type('Dia em que recebe', '40');
    const scroller = screen.getByText('Membro desde março de 2026').parentElement!.parentElement!;
    scroller.scrollTop = 300;
    fireEvent.click(toolbar('Salvar'));
    expect(screen.getByRole('alert').textContent).toBe(MESSAGES.payday);
    expect(scroller.scrollTop).toBe(0);
    expect(profileApi.update).not.toHaveBeenCalled();

    type('Dia em que recebe', '10');
    await save();
    expect(screen.queryByText(MESSAGES.payday)).toBeNull();
  });

  it('shows the API error when saving fails', async () => {
    jest.mocked(profileApi.update).mockRejectedValue(apiError('Estado (UF) inválido.'));
    await renderScreen();

    fireEvent.click(toolbar('Salvar'));

    expect(await screen.findByText('Estado (UF) inválido.')).toBeTruthy();
    expect(screen.getByText('Erro')).toBeTruthy();
  });

  it('tells while it is saving', async () => {
    let resolve!: (saved: ProfileDto) => void;
    jest.mocked(profileApi.update).mockReturnValue(new Promise((r) => (resolve = r)));
    await renderScreen();

    fireEvent.click(toolbar('Salvar'));
    expect(await screen.findByText('Salvando...')).toBeTruthy();

    await act(async () => resolve(profile({ name: 'Novo nome' })));
    expect(await screen.findByText('Dados salvos')).toBeTruthy();
    expect(field('Nome').value).toBe('Novo nome');
  });
});
