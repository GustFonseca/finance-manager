import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { DialogProvider } from '@/components/ui';
import { ContextMenuProvider } from '@/components/xp/ContextMenu';
import { SoundProvider } from '@/components/xp/sound/SoundProvider';
import { WindowIdProvider, WindowManagerProvider } from '@/components/xp/WindowManager';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
}

type Options = RenderOptions & { client?: QueryClient; windowId?: string };

export function setTestPathname(pathname: string) {
  (globalThis as { __testPathname?: string }).__testPathname = pathname;
}

export function renderWithProviders(ui: React.ReactElement, { client = createTestQueryClient(), windowId = '/', ...options }: Options = {}) {
  setTestPathname(windowId);
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <WindowManagerProvider>
        <SoundProvider>
          <ContextMenuProvider>
            <DialogProvider>
              <WindowIdProvider value={windowId}>{children}</WindowIdProvider>
            </DialogProvider>
          </ContextMenuProvider>
        </SoundProvider>
      </WindowManagerProvider>
    </QueryClientProvider>
  );
  return { client, ...render(ui, { wrapper: Wrapper, ...options }) };
}
