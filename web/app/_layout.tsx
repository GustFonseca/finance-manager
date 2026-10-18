import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { ErrorBoundaryProps, Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { CrashDialog } from '@/components/xp/CrashDialog';
import { AppProviders } from '@/providers/AppProviders';
import { useAuth } from '@/features/auth/AuthContext';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <CrashDialog error={error} retry={retry} />;
}

export const unstable_settings = {
  initialRouteName: '(desktop)',
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!token && !inAuthGroup) {
      router.replace('/login');
    } else if (token && inAuthGroup) {
      router.replace('/');
    }
  }, [token, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts(FontAwesome.font);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <AppProviders>
      <AuthGuard>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(desktop)" options={{ headerShown: false }} />
        </Stack>
      </AuthGuard>
    </AppProviders>
  );
}
