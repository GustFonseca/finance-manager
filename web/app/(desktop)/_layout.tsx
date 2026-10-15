import React from 'react';
import { Slot } from 'expo-router';
import { ProgramScreens, XpShell } from '@/components/xp';
import { AccountsScreen } from '@/features/accounts/AccountsScreen';
import { CategoriesScreen } from '@/features/categories/CategoriesScreen';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { GoalsScreen } from '@/features/goals/GoalsScreen';
import { TransactionsScreen } from '@/features/transactions/TransactionsScreen';

/** Screen rendered inside each program's window, keyed by its route. */
const SCREENS: ProgramScreens = {
  '/': DashboardScreen,
  '/transactions': TransactionsScreen,
  '/accounts': AccountsScreen,
  '/goals': GoalsScreen,
  '/categories': CategoriesScreen,
};

/**
 * Every signed-in screen is a window on the XP desktop. The shell renders all
 * open windows at once; the routes below only drive the URL (the focused one).
 */
export default function DesktopLayout() {
  return (
    <XpShell screens={SCREENS}>
      <Slot />
    </XpShell>
  );
}
