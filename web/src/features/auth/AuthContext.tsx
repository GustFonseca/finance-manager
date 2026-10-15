import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getItem, setItem, deleteItem } from '@/lib/storage';
import { TOKEN_KEY, setUnauthorizedHandler } from '@/lib/http';
import { authApi } from './api';

const USER_KEY = 'user_data';

type User = { email: string; name: string };

type AuthState = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
};

type AuthContextType = AuthState & {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '932365675532-8nj494tuq5vnhtck4pimbqc61icfhdv4.apps.googleusercontent.com';

/** Inlined by Expo from `experiments.baseUrl` in app.json (e.g. `/finance-manager`). */
const BASE_PATH = process.env.EXPO_BASE_URL ?? '';

/**
 * Google demands an exact-match redirect URI, so it is derived from wherever
 * the app is actually being served instead of being hard-coded to production.
 * Every origin the app runs on (including `http://localhost:8081` for local
 * development) must be registered in the Google Cloud console.
 */
function redirectUri(): string {
  return `${window.location.origin}${BASE_PATH}`.replace(/\/+$/, '');
}

function extractIdTokenFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.substring(1));
  const idToken = params.get('id_token');
  if (idToken) {
    window.history.replaceState(null, '', window.location.pathname);
  }
  return idToken;
}

function startGoogleSignIn() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'id_token',
    scope: 'openid profile email',
    nonce: Math.random().toString(36).substring(2),
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
  });
  const hashTokenRef = useRef(extractIdTokenFromHash());

  useEffect(() => {
    loadToken();
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, []);

  async function loadToken() {
    const existingToken = await getItem(TOKEN_KEY);
    const userJson = await getItem(USER_KEY);
    if (existingToken && userJson) {
      setState({ token: existingToken, user: JSON.parse(userJson), isLoading: false });
      return;
    }

    const hashToken = hashTokenRef.current;
    if (hashToken) {
      hashTokenRef.current = null;
      await handleGoogleToken(hashToken);
      return;
    }

    setState((prev) => ({ ...prev, isLoading: false }));
  }

  async function handleGoogleToken(idToken: string) {
    try {
      const { data } = await authApi.googleLogin(idToken);
      await setItem(TOKEN_KEY, data.token);
      const user: User = { email: data.email, name: data.name };
      await setItem(USER_KEY, JSON.stringify(user));
      setState({ token: data.token, user, isLoading: false });
    } catch (error) {
      console.error('Auth failed:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }

  async function signInWithGoogle() {
    startGoogleSignIn();
  }

  async function signOut() {
    await deleteItem(TOKEN_KEY);
    await deleteItem(USER_KEY);
    setState({ token: null, user: null, isLoading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
