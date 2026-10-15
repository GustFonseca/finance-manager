import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Desktop } from './Desktop';
import { StartMenu } from './StartMenu';
import { Taskbar } from './Taskbar';
import { WindowManagerProvider } from './WindowManager';

/** The whole XP desktop: wallpaper + windows, Start menu and taskbar. */
export function XpShell({ children }: { children: React.ReactNode }) {
  const [startOpen, setStartOpen] = useState(false);

  return (
    <WindowManagerProvider>
      <View style={styles.screen}>
        <Desktop>{children}</Desktop>
        <StartMenu visible={startOpen} onClose={() => setStartOpen(false)} />
        <Taskbar startOpen={startOpen} onToggleStart={() => setStartOpen((open) => !open)} />
      </View>
    </WindowManagerProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, position: 'relative' },
});
