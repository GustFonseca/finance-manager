import React from 'react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { setUnauthorizedHandler } from '@/lib/http';
import { reportError } from '@/lib/logger';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '../AuthContext';
import { authApi } from '../api';

jest.mock('../api');
jest.mock('@/lib/logger', () => ({ reportError: jest.fn() }));
jest.mock('@/lib/http', () => ({ TOKEN_KEY: 'jwt_token', setUnauthorizedHandler: jest.fn() }));

function Probe() {
  const { token, user, isLoading } = useAuth();
  return <span data-testid="state">{JSON.stringify({ token, user, isLoading })}</span>;
}

const state = () => JSON.parse(screen.getByTestId('state').textContent!);

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('AuthProvider', () => {
  it('restores a stored session', async () => {
    localStorage.setItem('jwt_token', 'tok');
    localStorage.setItem('user_data', JSON.stringify({ email: 'g@x.com', name: 'Gustavo' }));
    render(<Probe />, { wrapper });

    expect(state().isLoading).toBe(true);
    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(state()).toEqual({ token: 'tok', user: { email: 'g@x.com', name: 'Gustavo' }, isLoading: false });
    expect(authApi.googleLogin).not.toHaveBeenCalled();
  });

  it('ignores a token whose stored user is corrupt', async () => {
    localStorage.setItem('jwt_token', 'tok');
    localStorage.setItem('user_data', '{not json');
    render(<Probe />, { wrapper });

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(state()).toEqual({ token: null, user: null, isLoading: false });
  });

  it('ignores a hash without an id_token', async () => {
    window.history.replaceState(null, '', '/#state=abc');
    render(<Probe />, { wrapper });

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(state().token).toBeNull();
    expect(window.location.hash).toBe('#state=abc');
    expect(authApi.googleLogin).not.toHaveBeenCalled();
  });

  it('logs in with the Google id_token from the URL hash', async () => {
    window.history.replaceState(null, '', '/spending#id_token=google-jwt&token_type=Bearer');
    jest.mocked(authApi.googleLogin).mockResolvedValue({
      data: { token: 'app-jwt', email: 'g@x.com', name: 'Gustavo' },
    } as never);
    render(<Probe />, { wrapper });

    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe('/spending');
    await waitFor(() => expect(state().token).toBe('app-jwt'));
    expect(authApi.googleLogin).toHaveBeenCalledWith('google-jwt');
    expect(state().user).toEqual({ email: 'g@x.com', name: 'Gustavo' });
    expect(localStorage.getItem('jwt_token')).toBe('app-jwt');
    expect(JSON.parse(localStorage.getItem('user_data')!)).toEqual({ email: 'g@x.com', name: 'Gustavo' });
  });

  it('reports a failed Google login', async () => {
    window.history.replaceState(null, '', '/#id_token=bad');
    jest.mocked(authApi.googleLogin).mockRejectedValue(new Error('401'));
    render(<Probe />, { wrapper });

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(reportError).toHaveBeenCalledWith('Login com o Google falhou: 401');
    expect(state().token).toBeNull();
  });

  it('reports a failed Google login that is not an Error', async () => {
    window.history.replaceState(null, '', '/#id_token=bad');
    jest.mocked(authApi.googleLogin).mockRejectedValue('nope');
    render(<Probe />, { wrapper });

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(reportError).toHaveBeenCalledWith('Login com o Google falhou');
  });

  it('signs out, clearing storage and the query cache', async () => {
    localStorage.setItem('jwt_token', 'tok');
    localStorage.setItem('user_data', JSON.stringify({ email: 'g@x.com', name: 'Gustavo' }));
    const clear = jest.spyOn(queryClient, 'clear');
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.token).toBe('tok'));

    await act(() => result.current.signOut());
    expect(result.current).toMatchObject({ token: null, user: null, isLoading: false });
    expect(localStorage.getItem('jwt_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
    expect(clear).toHaveBeenCalled();
    clear.mockRestore();
  });

  it('signs out when the API answers 401 and unregisters on unmount', async () => {
    localStorage.setItem('jwt_token', 'tok');
    localStorage.setItem('user_data', JSON.stringify({ email: 'g@x.com', name: 'Gustavo' }));
    const { result, unmount } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.token).toBe('tok'));

    const handler = jest.mocked(setUnauthorizedHandler).mock.calls[0][0]!;
    await act(async () => {
      handler();
    });
    await waitFor(() => expect(result.current.token).toBeNull());
    expect(localStorage.getItem('jwt_token')).toBeNull();

    unmount();
    expect(setUnauthorizedHandler).toHaveBeenLastCalledWith(null);
  });

  it('redirects to the Google consent screen', async () => {
    const original = window.location;
    const fake = { origin: 'http://localhost:8081', href: '', hash: '', pathname: '/' };
    delete (window as { location?: Location }).location;
    (window as unknown as { location: typeof fake }).location = fake;
    try {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await act(() => result.current.signInWithGoogle());

      const url = new URL(fake.href);
      expect(`${url.origin}${url.pathname}`).toBe('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:8081');
      expect(url.searchParams.get('response_type')).toBe('id_token');
      expect(url.searchParams.get('scope')).toBe('openid profile email');
      expect(url.searchParams.get('client_id')).toBeTruthy();
      expect(url.searchParams.get('nonce')).toBeTruthy();
    } finally {
      (window as unknown as { location: Location }).location = original;
    }
  });
});

describe('useAuth without a provider', () => {
  it('returns a loading, signed-out default with no-op actions', async () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current).toMatchObject({ token: null, user: null, isLoading: true });
    await expect(result.current.signInWithGoogle()).resolves.toBeUndefined();
    await expect(result.current.signOut()).resolves.toBeUndefined();
  });
});
