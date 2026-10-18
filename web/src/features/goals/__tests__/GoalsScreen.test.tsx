import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { GoalsScreen } from '../GoalsScreen';
import { goalsApi } from '../api';
import { GoalDto } from '../types';

jest.mock('../api');

const api = jest.mocked(goalsApi);
const trip: GoalDto = {
  id: 'g1',
  name: 'Viagem',
  targetCents: 500000,
  currentCents: 125000,
  deadline: '2026-12-20T12:00:00Z',
  status: 'ACTIVE',
  progressPercent: 25,
};
const car: GoalDto = {
  id: 'g2',
  name: 'Carro',
  targetCents: 100000,
  currentCents: 100000,
  deadline: null,
  status: 'COMPLETED',
  progressPercent: 100,
};
const apiError = (message: string) => ({ isAxiosError: true, response: { status: 400, data: { message } } });

function inputOf(label: string) {
  return screen.getByText(label).parentElement!.querySelector('input')!;
}

function renderScreen() {
  return renderWithProviders(<GoalsScreen />, { windowId: '/goals' });
}

describe('GoalsScreen', () => {
  it('shows the empty state', async () => {
    api.getAll.mockResolvedValue([]);
    renderScreen();
    await waitFor(() => expect(screen.getByText('Nenhuma meta criada')).toBeTruthy());
    expect(screen.getByText('0 meta(s)')).toBeTruthy();
  });

  it('shows the goals with progress, status and deadline', async () => {
    api.getAll.mockResolvedValue([trip, car, { ...car, id: 'g3', name: 'Casa', status: 'CANCELLED' }]);
    renderScreen();

    await waitFor(() => expect(screen.getByText('Viagem')).toBeTruthy());
    expect(screen.getByText('Ativa')).toBeTruthy();
    expect(screen.getByText('Concluída')).toBeTruthy();
    expect(screen.getByText('Cancelada')).toBeTruthy();
    expect(screen.getByText('25.0% concluído')).toBeTruthy();
    expect(screen.getAllByText('100.0% concluído')).toHaveLength(2);
    expect(screen.getByText(/Prazo: 20\/12\/2026/)).toBeTruthy();
    expect(screen.getAllByText('Adicionar...')).toHaveLength(1);
    expect(screen.getByText('3 meta(s)')).toBeTruthy();
  });

  it('creates a goal and refreshes the list', async () => {
    api.getAll.mockResolvedValue([]);
    api.create.mockResolvedValue(trip);
    const { client } = renderScreen();
    const invalidate = jest.spyOn(client, 'invalidateQueries');

    fireEvent.click(await screen.findByText('Nova meta'));
    expect(screen.getByText('Nova Meta')).toBeTruthy();
    fireEvent.change(inputOf('Nome da meta:'), { target: { value: ' Viagem ' } });
    fireEvent.click(screen.getByText('Criar'));
    expect(api.create).not.toHaveBeenCalled();

    fireEvent.change(inputOf('Valor alvo:'), { target: { value: '5000,00' } });
    fireEvent.click(screen.getByText('Criar'));

    await waitFor(() => expect(api.create).toHaveBeenCalledWith({ name: 'Viagem', targetCents: 500000 }));
    await waitFor(() => expect(screen.queryByText('Nova Meta')).toBeNull());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['goals'] });
  });

  it('cancels the new goal form', async () => {
    api.getAll.mockResolvedValue([]);
    renderScreen();
    fireEvent.click(await screen.findByText('Nova meta'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Nova Meta')).toBeNull());
  });

  it('alerts when creating fails', async () => {
    api.getAll.mockResolvedValue([]);
    api.create.mockRejectedValue(new Error('x'));
    renderScreen();

    fireEvent.click(await screen.findByText('Nova meta'));
    fireEvent.change(inputOf('Nome da meta:'), { target: { value: 'Viagem' } });
    fireEvent.change(inputOf('Valor alvo:'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Criar'));

    await waitFor(() => expect(screen.getByText('Não foi possível criar a meta')).toBeTruthy());
  });

  it('adds progress to a goal', async () => {
    api.getAll.mockResolvedValue([trip]);
    api.addProgress.mockResolvedValue(trip);
    renderScreen();

    fireEvent.click(await screen.findByText('Adicionar...'));
    expect(screen.getByText('Adicionar Valor — Viagem')).toBeTruthy();
    fireEvent.click(screen.getByText('Adicionar'));
    expect(api.addProgress).not.toHaveBeenCalled();

    fireEvent.change(inputOf('Valor:'), { target: { value: '100,50' } });
    fireEvent.click(screen.getByText('Adicionar'));

    await waitFor(() => expect(api.addProgress).toHaveBeenCalledWith('g1', 10050));
    await waitFor(() => expect(screen.queryByText('Adicionar Valor — Viagem')).toBeNull());
  });

  it('closes the progress form and alerts when adding fails', async () => {
    api.getAll.mockResolvedValue([trip]);
    api.addProgress.mockRejectedValue(apiError('Meta encerrada'));
    renderScreen();

    fireEvent.click(await screen.findByText('Adicionar...'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Adicionar Valor — Viagem')).toBeNull());

    fireEvent.click(screen.getByText('Adicionar...'));
    fireEvent.change(inputOf('Valor:'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Adicionar'));

    await waitFor(() => expect(screen.getByText('Meta encerrada')).toBeTruthy());
  });

  it('completes a goal after confirmation', async () => {
    api.getAll.mockResolvedValue([trip]);
    api.complete.mockResolvedValue({ ...trip, status: 'COMPLETED' });
    renderScreen();

    fireEvent.click(await screen.findByText('Concluir'));
    expect(screen.getByText('Deseja concluir a meta "Viagem"?')).toBeTruthy();
    fireEvent.click(screen.getAllByText('Concluir')[1]);

    await waitFor(() => expect(api.complete).toHaveBeenCalledWith('g1'));
  });

  it('does not complete when cancelled and alerts when completion fails', async () => {
    api.getAll.mockResolvedValue([trip]);
    api.complete.mockRejectedValue(new Error('x'));
    renderScreen();

    fireEvent.click(await screen.findByText('Concluir'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Deseja concluir a meta "Viagem"?')).toBeNull());
    expect(api.complete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Concluir'));
    fireEvent.click(screen.getAllByText('Concluir')[1]);
    await waitFor(() => expect(screen.getByText('Não foi possível concluir a meta')).toBeTruthy());
  });

  it('removes a goal after confirmation', async () => {
    api.getAll.mockResolvedValue([trip]);
    api.remove.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.click(await screen.findByText('Remover'));
    expect(screen.getByText('Deseja remover a meta "Viagem"?')).toBeTruthy();
    fireEvent.click(screen.getAllByText('Remover')[1]);

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('g1'));
  });

  it('does not remove when cancelled and alerts when removal fails', async () => {
    api.getAll.mockResolvedValue([trip]);
    api.remove.mockRejectedValue(new Error('x'));
    renderScreen();

    fireEvent.click(await screen.findByText('Remover'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Deseja remover a meta "Viagem"?')).toBeNull());
    expect(api.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Remover'));
    fireEvent.click(screen.getAllByText('Remover')[1]);
    await waitFor(() => expect(screen.getByText('Não foi possível remover a meta')).toBeTruthy());
  });
});
