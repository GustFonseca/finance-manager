import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { WAKE_MESSAGE } from '@/components/xp';
import { http } from '@/lib/http';
import { SLOW_REQUEST_MS, trackRequest } from '@/lib/serverWake';
import { useAuth } from '../AuthContext';
import { LoginScreen } from '../LoginScreen';
import { authApi } from '../api';
import { httpResponse } from '@/test/http';
import { holdDown } from '@/components/ui/__tests__/pointer';

jest.mock('../AuthContext', () => ({ useAuth: jest.fn() }));

describe('LoginScreen', () => {
  it('starts the Google sign-in when the user tile is clicked', () => {
    const signInWithGoogle = jest.fn();
    jest.mocked(useAuth).mockReturnValue({ signInWithGoogle } as never);
    render(<LoginScreen />);

    expect(screen.getAllByText('Finance Manager')).toHaveLength(2);
    expect(screen.getByTestId('icon-desktop')).toBeTruthy();
    expect(screen.getByText('Para começar, clique no seu nome de usuário')).toBeTruthy();
    expect(screen.getByText('Use sua conta Google')).toBeTruthy();
    expect(screen.getByText(/Depois de fazer logon/)).toBeTruthy();

    const tile = screen.getByLabelText('Entrar com Google');
    const before = tile.className;
    fireEvent.mouseEnter(tile);
    expect(tile.className).not.toBe(before);
    fireEvent.click(tile);
    expect(signInWithGoogle).toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText(WAKE_MESSAGE)).toBeNull();
  });

  it('sinks the sign-in tile while it is pressed', () => {
    jest.mocked(useAuth).mockReturnValue({ signInWithGoogle: jest.fn() } as never);
    render(<LoginScreen />);
    const tile = screen.getByLabelText('Entrar com Google');
    const idle = tile.className;

    holdDown(tile);

    expect(tile.className).not.toBe(idle);
  });

  it('shows the login error', () => {
    jest.mocked(useAuth).mockReturnValue({ signInWithGoogle: jest.fn(), error: 'Falhou o login' } as never);
    render(<LoginScreen />);

    expect(screen.getByRole('alert').textContent).toBe('Falhou o login');
  });

  it('explains the delay while the server is waking up', () => {
    jest.useFakeTimers();
    jest.mocked(useAuth).mockReturnValue({ signInWithGoogle: jest.fn(), error: null } as never);
    render(<LoginScreen />);
    let done = () => {};

    act(() => {
      done = trackRequest();
      jest.advanceTimersByTime(SLOW_REQUEST_MS);
    });
    expect(screen.getByText(WAKE_MESSAGE)).toBeTruthy();

    act(() => done());
    expect(screen.queryByText(WAKE_MESSAGE)).toBeNull();
    jest.useRealTimers();
  });
});

describe('authApi', () => {
  it('posts the Google id token', async () => {
    const post = jest.spyOn(http, 'post').mockResolvedValue(httpResponse({ token: 't' }));
    await expect(authApi.googleLogin('id-tok')).resolves.toEqual(httpResponse({ token: 't' }));
    expect(post).toHaveBeenCalledWith('/auth/google', { idToken: 'id-tok' });
    post.mockRestore();
  });
});
