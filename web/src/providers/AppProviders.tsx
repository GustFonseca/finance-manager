import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { installGlobalErrorReporting } from '@/lib/logger';
import { persistOfflineCache } from '@/lib/offlineCache';
import { queryClient } from '@/lib/queryClient';
import { registerServiceWorker } from '@/lib/serviceWorker';
import { AuthProvider } from '@/features/auth/AuthContext';
import { DialogProvider } from '@/components/ui';
import { colors } from '@/theme';

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.desktop },
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(installGlobalErrorReporting, []);
  useEffect(() => persistOfflineCache(queryClient), []);
  useEffect(() => registerServiceWorker(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navigationTheme}>
        <AuthProvider>
          <DialogProvider>{children}</DialogProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
