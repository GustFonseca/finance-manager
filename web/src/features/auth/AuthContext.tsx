import { reportError } from '@/lib/logger';
import { clearOfflineCache, restoreOfflineCache } from '@/lib/offlineCache';
import { queryClient } from '@/lib/queryClient';
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getItem, setItem, deleteItem } from '@/lib/storage';
import { TOKEN_KEY, setUnauthorizedHandler } from '@/lib/http';
import { authApi } from './api';

const USER_KEY = 'user_data';
export const GOOGLE_NONCE_KEY = 'fm_google_nonce';

export const LOGIN_FAILED = 'Não foi possível entrar com o Google. Tente novamente.';

type User = { email: string; name: string };

type AuthState = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
};

type AuthContextType = AuthState & {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (changes: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoading: true,
  error: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
});

const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '932365675532-8nj494tuq5vnhtck4pimbqc61icfhdv4.apps.googleusercontent.com';

const BASE_PATH = process.env.EXPO_BASE_URL ?? '';

function redirectUri(): string {
  return `${window.location.origin}${BASE_PATH}`.replace(/\/+$/, '');
}

type GoogleCredential = { idToken: string; nonce: string };

function takePendingNonce(): string | null {
  try {
    const nonce = sessionStorage.getItem(GOOGLE_NONCE_KEY);
    sessionStorage.removeItem(GOOGLE_NONCE_KEY);
    return nonce;
  } catch {
    return null;
  }
}

function extractCredentialFromHash(): GoogleCredential | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.substring(1));
  const idToken = params.get('id_token');
  if (!idToken) return null;
  window.history.replaceState(null, '', window.location.pathname);
  const nonce = takePendingNonce();
  return nonce ? { idToken, nonce } : null;
}

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function parseUser(json: string | null): User | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as User;
  } catch {
    return null;
  }
}

function startGoogleSignIn() {
  const nonce = generateNonce();
  sessionStorage.setItem(GOOGLE_NONCE_KEY, nonce);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'id_token',
    scope: 'openid profile email',
    nonce,
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    error: null,
  });
  const hashCredentialRef = useRef(extractCredentialFromHash());

  useEffect(() => {
    loadToken();
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, []);

  async function loadToken() {
    const existingToken = await getItem(TOKEN_KEY);
    const userJson = await getItem(USER_KEY);
    const user = parseUser(userJson);
    if (existingToken && user) {
      restoreOfflineCache(queryClient, user.email);
      setState({ token: existingToken, user, isLoading: false, error: null });
      return;
    }

    const credential = hashCredentialRef.current;
    if (credential) {
      hashCredentialRef.current = null;
      await handleGoogleCredential(credential);
      return;
    }

    setState((prev) => ({ ...prev, isLoading: false }));
  }

  async function handleGoogleCredential({ idToken, nonce }: GoogleCredential) {
    try {
      const { data } = await authApi.googleLogin(idToken, nonce);
      await setItem(TOKEN_KEY, data.token);
      const user: User = { email: data.email, name: data.name };
      await setItem(USER_KEY, JSON.stringify(user));
      restoreOfflineCache(queryClient, user.email);
      setState({ token: data.token, user, isLoading: false, error: null });
    } catch (error) {
      reportError(error instanceof Error ? `Login com o Google falhou: ${error.message}` : 'Login com o Google falhou');
      setState((prev) => ({ ...prev, isLoading: false, error: LOGIN_FAILED }));
    }
  }

  async function signInWithGoogle() {
    startGoogleSignIn();
  }

  async function signOut() {
    await deleteItem(TOKEN_KEY);
    await deleteItem(USER_KEY);
    queryClient.clear();
    clearOfflineCache();
    setState({ token: null, user: null, isLoading: false, error: null });
  }

  async function updateUser(changes: Partial<User>) {
    if (!state.user) return;
    const user = { ...state.user, ...changes };
    await setItem(USER_KEY, JSON.stringify(user));
    setState((prev) => ({ ...prev, user }));
  }

  return (
    <AuthContext.Provider value={{ ...state, signInWithGoogle, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
