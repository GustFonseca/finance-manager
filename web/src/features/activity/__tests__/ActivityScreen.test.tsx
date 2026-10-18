import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { ActivityScreen } from '../ActivityScreen';
import { activityApi } from '../api';
import { ActivityLogDto } from '../types';

jest.mock('../api');

const listProps: { current: { onEndReached?: () => void } } = { current: {} };

jest.mock('react-native-web/dist/exports/FlatList', () => {
  const ReactActual = jest.requireActual('react');
  const Actual = jest.requireActual('react-native-web/dist/exports/FlatList').default;
  const FlatList = (props: Record<string, unknown>) => {
    listProps.current = props;
    return ReactActual.createElement(Actual, { ...props, initialNumToRender: 100 });
  };
  return { __esModule: true, default: FlatList };
});

function entry(i: number, overrides: Partial<ActivityLogDto> = {}): ActivityLogDto {
  return {
    id: `e${i}`,
    type: 'INFO',
    source: i % 2 ? 'Importação' : 'Contas',
    description: `Evento ${i}`,
    createdAt: new Date(Date.UTC(2026, 9, 10, 12, 0, 0) - i * 60000).toISOString(),
    ...overrides,
  };
}

const firstPage = Array.from({ length: 50 }, (_, i) => entry(i));
const secondPage = [entry(50, { type: 'WARNING', source: 'Arquivos', description: 'Falha no envio' })];

describe('ActivityScreen', () => {
  it('pages through events when the end of the list is reached', async () => {
    jest.mocked(activityApi.getPage).mockImplementation(async (before) => (before ? secondPage : firstPage));
    renderWithProviders(<ActivityScreen />, { windowId: '/events' });

    await waitFor(() => expect(screen.getByText('50 evento(s) · role para carregar mais')).toBeTruthy());
    expect(activityApi.getPage).toHaveBeenCalledWith(undefined, 50);
    expect(screen.getByText('Evento 0')).toBeTruthy();

    await act(async () => {
      listProps.current.onEndReached!();
    });
    await waitFor(() => expect(screen.getByText('51 evento(s)')).toBeTruthy());
    expect(activityApi.getPage).toHaveBeenLastCalledWith(firstPage[49].createdAt, 50);
    expect(screen.getByText('Aviso')).toBeTruthy();
    expect(screen.getByTestId('icon-exclamation-triangle')).toBeTruthy();

    await act(async () => {
      listProps.current.onEndReached!();
    });
    expect(activityApi.getPage).toHaveBeenCalledTimes(2);
  });

  it('filters by source', async () => {
    jest.mocked(activityApi.getPage).mockResolvedValue([entry(1), entry(2), entry(3)]);
    const { container } = renderWithProviders(<ActivityScreen />, { windowId: '/events' });
    await waitFor(() => expect(screen.getByText('3 evento(s)')).toBeTruthy());

    const options = Array.from(container.querySelectorAll('option')).map((o) => o.textContent);
    expect(options).toEqual(['Todas', 'Contas', 'Importação']);

    fireEvent.change(container.querySelector('select')!, { target: { value: 'Contas' } });
    expect(screen.getByText('1 evento(s)')).toBeTruthy();
    expect(screen.getByText('Evento 2')).toBeTruthy();
    expect(screen.queryByText('Evento 1')).toBeNull();
  });

  it('selects an event on the first click and shows its properties on the second', async () => {
    const event = entry(1, { description: 'Extrato importado' });
    jest.mocked(activityApi.getPage).mockResolvedValue([event]);
    renderWithProviders(<ActivityScreen />, { windowId: '/events' });
    await waitFor(() => expect(screen.getByText('Extrato importado')).toBeTruthy());

    fireEvent.click(screen.getByText('Extrato importado'));
    expect(screen.queryByText('Propriedades do evento')).toBeNull();

    fireEvent.click(screen.getByText('Extrato importado'));
    expect(screen.getByText('Propriedades do evento')).toBeTruthy();
    const date = new Date(event.createdAt);
    expect(
      screen.getByText(
        `Data: ${date.toLocaleDateString('pt-BR')} Hora: ${date.toLocaleTimeString('pt-BR')} Tipo: Informações Origem: Importação Extrato importado`
      )
    ).toBeTruthy();
  });

  it('shows an empty state', async () => {
    jest.mocked(activityApi.getPage).mockResolvedValue([]);
    renderWithProviders(<ActivityScreen />, { windowId: '/events' });
    await waitFor(() => expect(screen.getByText('Nenhum evento registrado ainda.')).toBeTruthy());
    expect(screen.getByText('0 evento(s)')).toBeTruthy();
  });
});
