import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { getItem, setItem, deleteItem } from '../services/storage';
import * as WebBrowser from 'expo-web-browser';
import { authApi } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

type AuthState = {
  token: string | null;
  user: { email: string; name: string } | null;
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

const GOOGLE_CLIENT_ID = '932365675532-8nj494tuq5vnhtck4pimbqc61icfhdv4.apps.googleusercontent.com';
const WEB_REDIRECT_URI = 'https://gustfonseca.github.io/finance-manager';

function extractIdTokenFromHash(): string | null {
  if (Platform.OS !== 'web') return null;
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.substring(1));
  const idToken = params.get('id_token');
  if (idToken) {
    window.history.replaceState(null, '', window.location.pathname);
  }
  return idToken;
}

function webSignIn() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: WEB_REDIRECT_URI,
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

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: Platform.OS === 'web'
      ? WEB_REDIRECT_URI
      : makeRedirectUri({ useProxy: true }),
  });

  useEffect(() => {
    loadToken();
  }, []);

  // Handle native Expo auth response
  useEffect(() => {
    if (Platform.OS !== 'web' && response?.type === 'success') {
      const idToken = response.params.id_token;
      if (idToken) {
        handleGoogleToken(idToken);
      }
    }
  }, [response]);

  async function loadToken() {
    const existingToken = await getItem('jwt_token');
    const userJson = await getItem('user_data');
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
      await setItem('jwt_token', data.token);
      const user = { email: data.email, name: data.name };
      await setItem('user_data', JSON.stringify(user));
      setState({ token: data.token, user, isLoading: false });
    } catch (error) {
      console.error('Auth failed:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }

  async function signInWithGoogle() {
    if (Platform.OS === 'web') {
      webSignIn();
      return;
    }
    await promptAsync({ useProxy: true });
  }

  async function signOut() {
    await deleteItem('jwt_token');
    await deleteItem('user_data');
    setState({ token: null, user: null, isLoading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
