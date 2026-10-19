import React from 'react';
import { renderHook, fireEvent, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient, renderWithProviders } from '@/test/render';
import { CATEGORY_COLORS } from '@/components/ui';
import { CategoriesScreen } from '../CategoriesScreen';
import { CATEGORY_NAME_REQUIRED, CATEGORY_NAME_TOO_LONG } from '../components/CategoryForm';
import { categoriesApi } from '../api';
import { useCategories } from '../queries';
import { CategoryDto } from '../types';
import { apiError } from '@/test/http';

jest.mock('../api');

const api = jest.mocked(categoriesApi);
const food: CategoryDto = { id: 'c1', name: 'Alimentação', type: 'EXPENSE', color: '#4CAF50' };
const salary: CategoryDto = { id: 'c2', name: 'Salário', type: 'INCOME', color: '#2196F3' };
function inputOf(label: string) {
  return screen.getByText(label).parentElement!.querySelector('input')!;
}

function renderScreen() {
  return renderWithProviders(<CategoriesScreen />, { windowId: '/categories' });
}

describe('CategoriesScreen', () => {
  it('shows the empty state', async () => {
    api.getAll.mockResolvedValue([]);
    renderScreen();
    await waitFor(() => expect(screen.getByText('Nenhuma categoria')).toBeTruthy());
    expect(screen.getByText('0 categoria(s)')).toBeTruthy();
  });

  it('lists categories with their type', async () => {
    api.getAll.mockResolvedValue([food, salary]);
    renderScreen();
    await waitFor(() => expect(screen.getByText('Alimentação')).toBeTruthy());
    expect(screen.getByText('Salário')).toBeTruthy();
    expect(screen.getByText('Despesa')).toBeTruthy();
    expect(screen.getByText('Receita')).toBeTruthy();
    expect(screen.getByText('2 categoria(s)')).toBeTruthy();
  });

  it('creates a category with type and color', async () => {
    api.getAll.mockResolvedValue([]);
    api.create.mockResolvedValue(salary);
    const { client } = renderScreen();
    const invalidate = jest.spyOn(client, 'invalidateQueries');

    fireEvent.click(await screen.findByText('Nova categoria'));
    expect(screen.getByText('Nova Categoria')).toBeTruthy();
    fireEvent.click(screen.getByText('Salvar'));
    expect(api.create).not.toHaveBeenCalled();
    expect(screen.getByText(CATEGORY_NAME_REQUIRED)).toBeTruthy();

    fireEvent.change(inputOf('Nome:'), { target: { value: 'x'.repeat(101) } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(api.create).not.toHaveBeenCalled();
    expect(screen.getByText(CATEGORY_NAME_TOO_LONG)).toBeTruthy();

    fireEvent.change(inputOf('Nome:'), { target: { value: ' Salário ' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Receita' }));
    fireEvent.click(screen.getByLabelText(`Cor ${CATEGORY_COLORS[4]}`));
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({ name: 'Salário', type: 'INCOME', color: CATEGORY_COLORS[4] })
    );
    await waitFor(() => expect(screen.queryByText('Nova Categoria')).toBeNull());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['categories'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['summary'] });
  });

  it('edits a category keeping its values', async () => {
    api.getAll.mockResolvedValue([food]);
    api.update.mockResolvedValue(food);
    renderScreen();

    fireEvent.click(await screen.findByText('Alimentação'));
    fireEvent.click(screen.getByText('Editar'));
    expect(screen.getByText('Editar Categoria')).toBeTruthy();
    expect(inputOf('Nome:').value).toBe('Alimentação');
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('c1', { name: 'Alimentação', type: 'EXPENSE', color: '#4CAF50' })
    );
  });

  it('closes the form on cancel', async () => {
    api.getAll.mockResolvedValue([]);
    renderScreen();
    fireEvent.click(await screen.findByText('Nova categoria'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Nova Categoria')).toBeNull());
  });

  it('alerts when saving fails', async () => {
    api.getAll.mockResolvedValue([]);
    api.create.mockRejectedValue(new Error('x'));
    renderScreen();

    fireEvent.click(await screen.findByText('Nova categoria'));
    fireEvent.change(inputOf('Nome:'), { target: { value: 'Lazer' } });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => expect(screen.getByText('Não foi possível salvar a categoria')).toBeTruthy());
  });

  it('removes a category after confirmation', async () => {
    api.getAll.mockResolvedValue([food]);
    api.remove.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.click(await screen.findByText('Alimentação'));
    fireEvent.click(screen.getByText('Remover'));
    expect(screen.getByText('Deseja remover "Alimentação"?')).toBeTruthy();
    fireEvent.click(screen.getByText('Remover'));

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('c1'));
  });

  it('does nothing when the removal is cancelled', async () => {
    api.getAll.mockResolvedValue([food]);
    renderScreen();

    fireEvent.click(await screen.findByText('Alimentação'));
    fireEvent.click(screen.getByText('Remover'));
    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => expect(screen.queryByText('Deseja remover "Alimentação"?')).toBeNull());
    expect(api.remove).not.toHaveBeenCalled();
  });

  it('alerts the server message when the removal fails', async () => {
    api.getAll.mockResolvedValue([food]);
    api.remove.mockRejectedValue(apiError('Categoria em uso'));
    renderScreen();

    fireEvent.click(await screen.findByText('Alimentação'));
    fireEvent.click(screen.getByText('Remover'));
    fireEvent.click(screen.getByText('Remover'));

    await waitFor(() => expect(screen.getByText('Categoria em uso')).toBeTruthy());
  });
});

describe('useCategories', () => {
  it('loads only one type when asked', async () => {
    api.getAll.mockResolvedValue([salary]);
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCategories('INCOME'), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([salary]));
    expect(api.getAll).toHaveBeenCalledWith('INCOME');
    expect(client.getQueryData(['categories', 'INCOME'])).toEqual([salary]);
  });
});
