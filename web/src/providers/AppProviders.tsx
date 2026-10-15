import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/features/auth/AuthContext';
import { DialogProvider } from '@/components/ui';

/** Single composition root for all app-wide context providers. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={DarkTheme}>
        <AuthProvider>
          <DialogProvider>{children}</DialogProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
