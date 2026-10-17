import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { installGlobalErrorReporting } from '@/lib/logger';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/features/auth/AuthContext';
import { DialogProvider } from '@/components/ui';
import { colors } from '@/theme';

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.desktop },
};

/** Single composition root for all app-wide context providers. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  // Errors no component caught still reach the API logs.
  useEffect(installGlobalErrorReporting, []);

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
