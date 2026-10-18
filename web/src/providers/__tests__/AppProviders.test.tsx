import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@react-navigation/native';
import { Text } from 'react-native';
import { useDialog } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { installGlobalErrorReporting } from '@/lib/logger';
import { OFFLINE_CACHE_KEY } from '@/lib/offlineCache';
import { registerServiceWorker } from '@/lib/serviceWorker';
import { queryClient } from '@/lib/queryClient';
import { colors } from '@/theme';
import { AppProviders } from '../AppProviders';

const mockUninstall = jest.fn();

jest.mock('@/lib/serviceWorker', () => ({ registerServiceWorker: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  reportError: jest.fn(),
  installGlobalErrorReporting: jest.fn(() => mockUninstall),
}));

function Probe() {
  const client = useQueryClient();
  const theme = useTheme();
  const { isLoading } = useAuth();
  const dialog = useDialog();
  return (
    <>
      <Text>{client === queryClient ? 'cliente do app' : 'outro cliente'}</Text>
      <Text>{`fundo ${theme.colors.background}`}</Text>
      <Text>{isLoading ? 'carregando sessão' : 'sessão pronta'}</Text>
      <Text onPress={() => dialog.alert({ title: 'Olá' })}>abrir aviso</Text>
    </>
  );
}

describe('AppProviders', () => {
  it('provides the query client, the desktop theme, the session and dialogs', async () => {
    render(
      <AppProviders>
        <Probe />
      </AppProviders>
    );

    expect(screen.getByText('cliente do app')).toBeTruthy();
    expect(screen.getByText(`fundo ${colors.desktop}`)).toBeTruthy();
    await waitFor(() => expect(screen.getByText('sessão pronta')).toBeTruthy());

    act(() => {
      fireEvent.click(screen.getByText('abrir aviso'));
    });
    expect(screen.getByText('Olá')).toBeTruthy();
  });

  it('restores the last summary on startup, keeps saving it and registers the service worker', async () => {
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify([{ key: ['summary', 'saved'], data: { netCents: 7 }, updatedAt: 5 }]));
    render(
      <AppProviders>
        <Probe />
      </AppProviders>
    );
    await waitFor(() => expect(screen.getByText('sessão pronta')).toBeTruthy());

    expect(queryClient.getQueryData(['summary', 'saved'])).toEqual({ netCents: 7 });
    expect(registerServiceWorker).toHaveBeenCalled();
    await act(() => queryClient.fetchQuery({ queryKey: ['summary', 'fresh'], queryFn: async () => 1 }));
    expect(localStorage.getItem(OFFLINE_CACHE_KEY)).toContain('fresh');
    queryClient.clear();
  });

  it('reports uncaught errors while mounted', async () => {
    const { unmount } = render(
      <AppProviders>
        <Probe />
      </AppProviders>
    );
    await waitFor(() => expect(screen.getByText('sessão pronta')).toBeTruthy());

    expect(installGlobalErrorReporting).toHaveBeenCalledTimes(1);
    unmount();

    expect(mockUninstall).toHaveBeenCalledTimes(1);
  });
});
