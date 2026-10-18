import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ContextMenuProvider } from './ContextMenu';
import { Desktop, ProgramScreens } from './Desktop';
import { OfflineNotice } from './OfflineNotice';
import { StartMenu } from './StartMenu';
import { Taskbar } from './Taskbar';
import { WakeBalloon } from './WakeBalloon';
import { SoundProvider } from './sound/SoundProvider';
import { WindowManagerProvider } from './WindowManager';

type Props = {
  screens: ProgramScreens;
  desktopExtras?: React.ReactNode;
  children: React.ReactNode;
};

export function XpShell({ screens, desktopExtras, children }: Props) {
  const [startOpen, setStartOpen] = useState(false);

  return (
    <WindowManagerProvider>
      <SoundProvider>
        <ContextMenuProvider>
          <View style={styles.screen}>
            <Desktop screens={screens} extras={desktopExtras}>
              {children}
            </Desktop>
            <StartMenu visible={startOpen} onClose={() => setStartOpen(false)} />
            <Taskbar startOpen={startOpen} onToggleStart={() => setStartOpen((open) => !open)} />
            <WakeBalloon />
            <OfflineNotice />
          </View>
        </ContextMenuProvider>
      </SoundProvider>
    </WindowManagerProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, position: 'relative' },
});
