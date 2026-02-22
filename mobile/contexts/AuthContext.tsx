import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
  });

  const redirectUri = makeRedirectUri({ native: 'finance-manager://' });
  console.log('OAuth redirect URI:', redirectUri);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      if (idToken) {
        handleGoogleToken(idToken);
      }
    }
  }, [response]);

  async function loadToken() {
    const token = await getItem('jwt_token');
    const userJson = await getItem('user_data');
    if (token && userJson) {
      setState({ token, user: JSON.parse(userJson), isLoading: false });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
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
    }
  }

  async function signInWithGoogle() {
    await promptAsync();
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
