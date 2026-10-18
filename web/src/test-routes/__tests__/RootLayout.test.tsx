import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useFonts } from 'expo-font';
import { router, useSegments } from 'expo-router';
import { useAuth } from '@/features/auth/AuthContext';
import RootLayout, { ErrorBoundary, unstable_settings } from '../../../app/_layout';

jest.mock('react-native-reanimated', () => ({}));
jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
jest.mock('expo-router', () => {
  const React = require('react');
  const routerMock = { navigate: jest.fn(), push: jest.fn(), replace: jest.fn(), back: jest.fn() };
  const Stack = ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'stack' }, children);
  Stack.Screen = ({ name }: { name: string }) => React.createElement('span', null, `tela ${name}`);
  return { router: routerMock, useRouter: () => routerMock, useSegments: jest.fn(), Stack };
});
jest.mock('@/providers/AppProviders', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/features/auth/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/components/xp/CrashDialog', () => {
  const React = require('react');
  return {
    CrashDialog: ({ error, retry }: { error: Error; retry: () => void }) =>
      React.createElement('button', { onClick: retry }, `Falha: ${error.message}`),
  };
});

function signedIn(token: string | null, isLoading = false) {
  jest.mocked(useAuth).mockReturnValue({ token, isLoading } as ReturnType<typeof useAuth>);
}

function at(...segments: string[]) {
  jest.mocked(useSegments).mockReturnValue(segments as ReturnType<typeof useSegments>);
}

beforeEach(() => {
  jest.mocked(useFonts).mockReturnValue([true, null]);
  signedIn('jwt');
  at('(desktop)');
});

describe('RootLayout', () => {
  it('opens on the desktop group', () => {
    expect(unstable_settings.initialRouteName).toBe('(desktop)');
  });

  it('renders nothing until the fonts are loaded', () => {
    jest.mocked(useFonts).mockReturnValue([false, null]);

    const { container } = render(<RootLayout />);

    expect(container.innerHTML).toBe('');
  });

  it('fails loudly when the fonts cannot be loaded', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.mocked(useFonts).mockReturnValue([false, new Error('fonte ausente')]);

    expect(() => render(<RootLayout />)).toThrow('fonte ausente');
  });

  it('declares the login and desktop screens', () => {
    render(<RootLayout />);

    expect(screen.getByText('tela login')).toBeTruthy();
    expect(screen.getByText('tela (desktop)')).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('sends signed-out visitors to the login screen', () => {
    signedIn(null);

    render(<RootLayout />);

    expect(router.replace).toHaveBeenCalledWith('/login');
  });

  it('keeps signed-out visitors on the login screen', () => {
    signedIn(null);
    at('login');

    render(<RootLayout />);

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('sends signed-in users away from the login screen', () => {
    at('login');

    render(<RootLayout />);

    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('waits for the session to load before redirecting', () => {
    signedIn(null, true);

    render(<RootLayout />);

    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe('ErrorBoundary', () => {
  it('shows the crash dialog and retries', () => {
    const retry = jest.fn();
    render(<ErrorBoundary error={new Error('quebrou')} retry={retry} />);

    fireEvent.click(screen.getByText('Falha: quebrou'));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
