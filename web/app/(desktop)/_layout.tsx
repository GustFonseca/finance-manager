import React from 'react';
import { Slot } from 'expo-router';
import { ProgramScreens, XpShell } from '@/components/xp';
import { useAuth } from '@/features/auth/AuthContext';
import { AccountsScreen } from '@/features/accounts/AccountsScreen';
import { ActivityScreen } from '@/features/activity/ActivityScreen';
import { CategoriesScreen } from '@/features/categories/CategoriesScreen';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { FileDesktop } from '@/features/files/FileDesktop';
import { GoalsScreen } from '@/features/goals/GoalsScreen';
import { TransactionsScreen } from '@/features/transactions/TransactionsScreen';

/** Screen rendered inside each program's window, keyed by its route. */
const SCREENS: ProgramScreens = {
  '/': DashboardScreen,
  '/transactions': TransactionsScreen,
  '/accounts': AccountsScreen,
  '/goals': GoalsScreen,
  '/categories': CategoriesScreen,
  '/events': ActivityScreen,
};

/**
 * Every signed-in screen is a window on the XP desktop. The shell renders all
 * open windows at once; the routes below only drive the URL (the focused one).
 */
export default function DesktopLayout() {
  const { token } = useAuth();

  // The router keeps this layout mounted under /login; without a session there
  // is no desktop (and its data must not be fetched). Logging off clears it.
  if (!token) return <Slot />;

  return (
    <XpShell screens={SCREENS} desktopExtras={<FileDesktop />}>
      <Slot />
    </XpShell>
  );
}
