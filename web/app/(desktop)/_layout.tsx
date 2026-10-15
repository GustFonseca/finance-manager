import React from 'react';
import { Slot } from 'expo-router';
import { XpShell } from '@/components/xp';

/** Every signed-in screen is a window on the XP desktop. */
export default function DesktopLayout() {
  return (
    <XpShell>
      <Slot />
    </XpShell>
  );
}
