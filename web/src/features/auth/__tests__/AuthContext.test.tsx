import React from 'react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { setUnauthorizedHandler } from '@/lib/http';
import { reportError } from '@/lib/logger';
import { queryClient } from '@/lib/queryClient';
import { OFFLINE_CACHE_PREFIX, offlineCacheKey } from '@/lib/offlineCache';
import { monthKeyOf, monthRange } from '@/lib/periods';
import { AuthProvider, GOOGLE_NONCE_KEY, LOGIN_FAILED, useAuth } from '../AuthContext';
import { authApi } from '../api';

jest.mock('../api');
jest.mock('@/lib/logger', () => ({ reportError: jest.fn() }));
jest.mock('@/lib/http', () => ({ TOKEN_KEY: 'jwt_token', setUnauthorizedHandler: jest.fn() }));

function Probe() {
  const { token, user, isLoading, error } = useAuth();
  return <span data-testid="state">{JSON.stringify({ token, user, isLoading, error })}</span>;
}

const state = () => JSON.parse(screen.getByTestId('state').textContent!);

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;

afterEach(() => {
  window.history.replaceState(null, '', '/');
  sessionStorage.clear();
  queryClient.clear();
});

function pendingNonce(nonce = 'n0nce') {
  sessionStorage.setItem(GOOGLE_NONCE_KEY, nonce);
}

describe('AuthProvider', () => {
  it('restores a stored session', async () => {
    localStorage.setItem('jwt_token', 'tok');
    localStorage.setItem('user_data', JSON.stringify({ email: 'g@x.com', name: 'Gustavo' }));
    render(<Probe />, { wrapper });

    expect(state().isLoading).toBe(true);
    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(state()).toEqual({ token: 'tok', user: { email: 'g@x.com', name: 'Gustavo' }, isLoading: false, error: null });
    expect(authApi.googleLogin).not.toHaveBeenCalled();
  });

  it('ignores a token whose stored user is corrupt', async () => {
    localStorage.setItem('jwt_token', 'tok');
    localStorage.setItem('user_data', '{not json');
    render(<Probe />, { wrapper });

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(state()).toEqual({ token: null, user: null, isLoading: false, error: null });
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
    pendingNonce('abc123');
    window.history.replaceState(null, '', '/spending#id_token=google-jwt&token_type=Bearer');
    jest.mocked(authApi.googleLogin).mockResolvedValue({
      data: { token: 'app-jwt', email: 'g@x.com', name: 'Gustavo' },
    } as never);
    render(<Probe />, { wrapper });

    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe('/spending');
    await waitFor(() => expect(state().token).toBe('app-jwt'));
    expect(authApi.googleLogin).toHaveBeenCalledWith('google-jwt', 'abc123');
    expect(sessionStorage.getItem(GOOGLE_NONCE_KEY)).toBeNull();
    expect(state().user).toEqual({ email: 'g@x.com', name: 'Gustavo' });
    expect(state().error).toBeNull();
    expect(localStorage.getItem('jwt_token')).toBe('app-jwt');
    expect(JSON.parse(localStorage.getItem('user_data')!)).toEqual({ email: 'g@x.com', name: 'Gustavo' });
  });

  it('ignores an id_token that this browser did not ask for', async () => {
    window.history.replaceState(null, '', '/spending#id_token=forged');
    render(<Probe />, { wrapper });

    expect(window.location.hash).toBe('');
    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(state().token).toBeNull();
    expect(authApi.googleLogin).not.toHaveBeenCalled();
  });

  it('ignores an id_token when the session storage is blocked', async () => {
    window.history.replaceState(null, '', '/#id_token=forged');
    pendingNonce();
    const realGetItem = Storage.prototype.getItem;
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key: string) {
      if (key === GOOGLE_NONCE_KEY) throw new Error('blocked');
      return realGetItem.call(this, key);
    });
    render(<Probe />, { wrapper });

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(authApi.googleLogin).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  it('restores the offline copy that belongs to the signed in user', async () => {
    const month = monthRange(monthKeyOf(new Date()));
    localStorage.setItem('jwt_token', 'tok');
    localStorage.setItem('user_data', JSON.stringify({ email: 'G@x.com', name: 'Gustavo' }));
    localStorage.setItem(offlineCacheKey('g@x.com'), JSON.stringify([{ key: ['summary', month], data: 7, updatedAt: Date.now() }]));
    localStorage.setItem(`${OFFLINE_CACHE_PREFIX}:v2:outra@x.com`, '[]');
    render(<Probe />, { wrapper });

    await waitFor(() => expect(state().token).toBe('tok'));
    expect(queryClient.getQueryData(['summary', month])).toBe(7);
    expect(localStorage.getItem(`${OFFLINE_CACHE_PREFIX}:v2:outra@x.com`)).toBeNull();
  });

  it('reports a failed Google login', async () => {
    pendingNonce();
    window.history.replaceState(null, '', '/#id_token=bad');
    jest.mocked(authApi.googleLogin).mockRejectedValue(new Error('401'));
    render(<Probe />, { wrapper });

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(reportError).toHaveBeenCalledWith('Login com o Google falhou: 401');
    expect(state().token).toBeNull();
    expect(state().error).toBe(LOGIN_FAILED);
  });

  it('clears the login error when signing out', async () => {
    pendingNonce();
    window.history.replaceState(null, '', '/#id_token=bad');
    jest.mocked(authApi.googleLogin).mockRejectedValue(new Error('401'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe(LOGIN_FAILED));

    await act(() => result.current.signOut());

    expect(result.current.error).toBeNull();
  });

  it('reports a failed Google login that is not an Error', async () => {
    pendingNonce();
    window.history.replaceState(null, '', '/#id_token=bad');
    jest.mocked(authApi.googleLogin).mockRejectedValue('nope');
    render(<Probe />, { wrapper });

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(reportError).toHaveBeenCalledWith('Login com o Google falhou');
    expect(state().error).toBe(LOGIN_FAILED);
  });

  it('signs out, clearing storage, the offline copy and the query cache', async () => {
    localStorage.setItem('jwt_token', 'tok');
    localStorage.setItem('fm_offline_summary', '[]');
    localStorage.setItem(offlineCacheKey('g@x.com'), '[]');
    localStorage.setItem('user_data', JSON.stringify({ email: 'g@x.com', name: 'Gustavo' }));
    const clear = jest.spyOn(queryClient, 'clear');
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.token).toBe('tok'));

    await act(() => result.current.signOut());
    expect(result.current).toMatchObject({ token: null, user: null, isLoading: false, error: null });
    expect(localStorage.getItem('jwt_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
    expect(localStorage.getItem('fm_offline_summary')).toBeNull();
    expect(localStorage.getItem(offlineCacheKey('g@x.com'))).toBeNull();
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

  it('updates the signed in user and keeps it stored', async () => {
    localStorage.setItem('jwt_token', 'tok');
    localStorage.setItem('user_data', JSON.stringify({ email: 'g@x.com', name: 'Gustavo' }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.token).toBe('tok'));

    await act(() => result.current.updateUser({ name: 'Gustavo Fonseca' }));

    expect(result.current.user).toEqual({ email: 'g@x.com', name: 'Gustavo Fonseca' });
    expect(JSON.parse(localStorage.getItem('user_data')!)).toEqual({ email: 'g@x.com', name: 'Gustavo Fonseca' });
  });

  it('ignores user updates while signed out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.updateUser({ name: 'Ninguém' }));

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
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
      expect(url.searchParams.get('nonce')).toMatch(/^[0-9a-f]{32}$/);
      expect(sessionStorage.getItem(GOOGLE_NONCE_KEY)).toBe(url.searchParams.get('nonce'));
    } finally {
      (window as unknown as { location: Location }).location = original;
    }
  });
});

describe('useAuth without a provider', () => {
  it('returns a loading, signed-out default with no-op actions', async () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current).toMatchObject({ token: null, user: null, isLoading: true, error: null });
    await expect(result.current.signInWithGoogle()).resolves.toBeUndefined();
    await expect(result.current.signOut()).resolves.toBeUndefined();
    await expect(result.current.updateUser({ name: 'x' })).resolves.toBeUndefined();
  });
});
