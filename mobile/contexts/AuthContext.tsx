import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
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

const GOOGLE_CLIENT_ID = 'YOUR-GOOGLE-CLIENT-ID.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri: AuthSession.makeRedirectUri({ scheme: 'finance-manager' }),
    },
    discovery
  );

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      handleGoogleToken(response.params.id_token);
    }
  }, [response]);

  async function loadToken() {
    const token = await SecureStore.getItemAsync('jwt_token');
    const userJson = await SecureStore.getItemAsync('user_data');
    if (token && userJson) {
      setState({ token, user: JSON.parse(userJson), isLoading: false });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }

  async function handleGoogleToken(idToken: string) {
    try {
      const { data } = await authApi.googleLogin(idToken);
      await SecureStore.setItemAsync('jwt_token', data.token);
      const user = { email: data.email, name: data.name };
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      setState({ token: data.token, user, isLoading: false });
    } catch (error) {
      console.error('Auth failed:', error);
    }
  }

  async function signInWithGoogle() {
    await promptAsync();
  }

  async function signOut() {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('user_data');
    setState({ token: null, user: null, isLoading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
