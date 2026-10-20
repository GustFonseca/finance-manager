import React from 'react';
import { Slot } from 'expo-router';
import { ProgramScreens, XpShell } from '@/components/xp';
import { useAuth } from '@/features/auth/AuthContext';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { FileDesktop } from '@/features/files/FileDesktop';
import { HELP } from '@/features/help/content';
import { presentHelp } from '@/features/help/HelpWizard';
import { lazyWithRetry } from '@/lib/lazyImport';

function lazyScreen(load: () => Promise<React.ComponentType>) {
  return lazyWithRetry(load);
}

const SCREENS: ProgramScreens = {
  '/': DashboardScreen,
  '/transactions': lazyScreen(() => import('@/features/transactions/TransactionsScreen').then((m) => m.TransactionsScreen)),
  '/accounts': lazyScreen(() => import('@/features/accounts/AccountsScreen').then((m) => m.AccountsScreen)),
  '/goals': lazyScreen(() => import('@/features/goals/GoalsScreen').then((m) => m.GoalsScreen)),
  '/categories': lazyScreen(() => import('@/features/categories/CategoriesScreen').then((m) => m.CategoriesScreen)),
  '/spending': lazyScreen(() => import('@/features/spending/SpendingScreen').then((m) => m.SpendingScreen)),
  '/merchants': lazyScreen(() => import('@/features/merchants/MerchantsScreen').then((m) => m.MerchantsScreen)),
  '/avoidable': lazyScreen(() => import('@/features/avoidable/AvoidableScreen').then((m) => m.AvoidableScreen)),
  '/savings': lazyScreen(() => import('@/features/savings/SavingsScreen').then((m) => m.SavingsScreen)),
  '/challenges': lazyScreen(() => import('@/features/challenges/ChallengesScreen').then((m) => m.ChallengesScreen)),
  '/events': lazyScreen(() => import('@/features/activity/ActivityScreen').then((m) => m.ActivityScreen)),
  '/wishlist': lazyScreen(() => import('@/features/wishlist/WishlistScreen').then((m) => m.WishlistScreen)),
  '/debts': lazyScreen(() => import('@/features/debts/DebtsScreen').then((m) => m.DebtsScreen)),
  '/planning': lazyScreen(() => import('@/features/planning/PlanningScreen').then((m) => m.PlanningScreen)),
  '/tax': lazyScreen(() => import('@/features/tax/TaxScreen').then((m) => m.TaxScreen)),
  '/calendar': lazyScreen(() => import('@/features/calendar/CalendarScreen').then((m) => m.CalendarScreen)),
  '/rules': lazyScreen(() => import('@/features/rules/RulesScreen').then((m) => m.RulesScreen)),
  '/users': lazyScreen(() => import('@/features/admin/UsersScreen').then((m) => m.UsersScreen)),
  '/account': lazyScreen(() => import('@/features/profile/AccountScreen').then((m) => m.AccountScreen)),
};

export default function DesktopLayout() {
  const { token } = useAuth();

  if (!token) return <Slot />;

  return (
    <XpShell screens={SCREENS} help={HELP} presentHelp={presentHelp} desktopExtras={<FileDesktop />}>
      <Slot />
    </XpShell>
  );
}
