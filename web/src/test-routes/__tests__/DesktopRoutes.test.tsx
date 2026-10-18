import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/features/auth/AuthContext';
import { LoginScreen } from '@/features/auth/LoginScreen';
import DesktopLayout from '../../../app/(desktop)/_layout';
import AccountsRoute from '../../../app/(desktop)/accounts';
import AvoidableRoute from '../../../app/(desktop)/avoidable';
import CategoriesRoute from '../../../app/(desktop)/categories';
import ChallengesRoute from '../../../app/(desktop)/challenges';
import EventsRoute from '../../../app/(desktop)/events';
import GoalsRoute from '../../../app/(desktop)/goals';
import DashboardRoute from '../../../app/(desktop)/index';
import MerchantsRoute from '../../../app/(desktop)/merchants';
import SavingsRoute from '../../../app/(desktop)/savings';
import SpendingRoute from '../../../app/(desktop)/spending';
import TransactionsRoute from '../../../app/(desktop)/transactions';
import LoginRoute from '../../../app/login';

jest.mock('@/features/auth/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/auth/LoginScreen', () => ({ LoginScreen: () => null }));
jest.mock('@/components/xp', () => {
  const React = require('react');
  return {
    XpShell: ({ screens, desktopExtras, children }: { screens: object; desktopExtras: React.ReactNode; children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'shell' }, Object.keys(screens).join(' '), desktopExtras, children),
  };
});
jest.mock('expo-router', () => {
  const React = require('react');
  return { Slot: () => React.createElement('span', null, 'rota atual') };
});

function mockScreen(name: string) {
  const React = require('react');
  return () => React.createElement('span', null, name);
}

jest.mock('@/features/accounts/AccountsScreen', () => ({ AccountsScreen: mockScreen('contas') }));
jest.mock('@/features/activity/ActivityScreen', () => ({ ActivityScreen: mockScreen('eventos') }));
jest.mock('@/features/avoidable/AvoidableScreen', () => ({ AvoidableScreen: mockScreen('gastos evitáveis') }));
jest.mock('@/features/categories/CategoriesScreen', () => ({ CategoriesScreen: mockScreen('categorias') }));
jest.mock('@/features/challenges/ChallengesScreen', () => ({ ChallengesScreen: mockScreen('desafios') }));
jest.mock('@/features/dashboard/DashboardScreen', () => ({ DashboardScreen: mockScreen('painel') }));
jest.mock('@/features/files/FileDesktop', () => ({ FileDesktop: mockScreen('arquivos na área de trabalho') }));
jest.mock('@/features/goals/GoalsScreen', () => ({ GoalsScreen: mockScreen('metas') }));
jest.mock('@/features/merchants/MerchantsScreen', () => ({ MerchantsScreen: mockScreen('estabelecimentos') }));
jest.mock('@/features/savings/SavingsScreen', () => ({ SavingsScreen: mockScreen('economia') }));
jest.mock('@/features/spending/SpendingScreen', () => ({ SpendingScreen: mockScreen('gastos') }));
jest.mock('@/features/transactions/TransactionsScreen', () => ({ TransactionsScreen: mockScreen('transações') }));

function signedIn(token: string | null) {
  jest.mocked(useAuth).mockReturnValue({ token } as ReturnType<typeof useAuth>);
}

describe('DesktopLayout', () => {
  it('renders only the current route while signed out', () => {
    signedIn(null);

    render(<DesktopLayout />);

    expect(screen.getByText('rota atual')).toBeTruthy();
    expect(screen.queryByTestId('shell')).toBeNull();
  });

  it('opens the XP shell with every program and the desktop files when signed in', () => {
    signedIn('jwt');

    render(<DesktopLayout />);

    const shell = screen.getByTestId('shell');
    expect(shell.textContent).toContain(
      '/ /transactions /accounts /goals /categories /spending /merchants /avoidable /savings /challenges /events'
    );
    expect(screen.getByText('arquivos na área de trabalho')).toBeTruthy();
    expect(screen.getByText('rota atual')).toBeTruthy();
  });
});

describe('program routes', () => {
  it.each([
    ['index', DashboardRoute],
    ['accounts', AccountsRoute],
    ['avoidable', AvoidableRoute],
    ['categories', CategoriesRoute],
    ['challenges', ChallengesRoute],
    ['events', EventsRoute],
    ['goals', GoalsRoute],
    ['merchants', MerchantsRoute],
    ['savings', SavingsRoute],
    ['spending', SpendingRoute],
    ['transactions', TransactionsRoute],
  ])('%s renders nothing because the shell draws the window', (_, Route) => {
    const { container } = render(<Route />);

    expect(container.innerHTML).toBe('');
  });
});

describe('login route', () => {
  it('shows the login screen', () => {
    expect(LoginRoute).toBe(LoginScreen);
  });
});
