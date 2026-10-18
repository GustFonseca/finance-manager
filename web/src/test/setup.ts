import { cleanup } from '@testing-library/react';

jest.mock('expo-router', () => {
  const router = { navigate: jest.fn(), push: jest.fn(), replace: jest.fn(), back: jest.fn() };
  return {
    useRouter: () => router,
    usePathname: () => (globalThis as { __testPathname?: string }).__testPathname ?? '/',
    useLocalSearchParams: () => ({}),
    Redirect: () => null,
    Slot: () => null,
    Stack: Object.assign(() => null, { Screen: () => null }),
    Link: ({ children }: { children: unknown }) => children,
    router,
  };
});

jest.mock('@expo/vector-icons/FontAwesome', () => {
  const React = require('react');
  const Icon = ({ name, testID }: { name: string; testID?: string }) =>
    React.createElement('span', { 'data-icon': name, 'data-testid': testID ?? `icon-${name}` });
  return { __esModule: true, default: Icon };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  jest.clearAllMocks();
});
