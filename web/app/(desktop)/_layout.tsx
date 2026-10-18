import React from 'react';
import { Slot } from 'expo-router';
import { ProgramScreens, XpShell } from '@/components/xp';
import { useAuth } from '@/features/auth/AuthContext';
import { AccountsScreen } from '@/features/accounts/AccountsScreen';
import { ActivityScreen } from '@/features/activity/ActivityScreen';
import { AvoidableScreen } from '@/features/avoidable/AvoidableScreen';
import { CategoriesScreen } from '@/features/categories/CategoriesScreen';
import { ChallengesScreen } from '@/features/challenges/ChallengesScreen';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { FileDesktop } from '@/features/files/FileDesktop';
import { GoalsScreen } from '@/features/goals/GoalsScreen';
import { MerchantsScreen } from '@/features/merchants/MerchantsScreen';
import { SavingsScreen } from '@/features/savings/SavingsScreen';
import { SpendingScreen } from '@/features/spending/SpendingScreen';
import { TransactionsScreen } from '@/features/transactions/TransactionsScreen';

const SCREENS: ProgramScreens = {
  '/': DashboardScreen,
  '/transactions': TransactionsScreen,
  '/accounts': AccountsScreen,
  '/goals': GoalsScreen,
  '/categories': CategoriesScreen,
  '/spending': SpendingScreen,
  '/merchants': MerchantsScreen,
  '/avoidable': AvoidableScreen,
  '/savings': SavingsScreen,
  '/challenges': ChallengesScreen,
  '/events': ActivityScreen,
};

export default function DesktopLayout() {
  const { token } = useAuth();

  if (!token) return <Slot />;

  return (
    <XpShell screens={SCREENS} desktopExtras={<FileDesktop />}>
      <Slot />
    </XpShell>
  );
}
