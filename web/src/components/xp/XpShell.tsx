import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ContextMenuProvider } from './ContextMenu';
import { HelpPresenter, HelpProvider, HelpRegistry } from './help';
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
  help?: HelpRegistry;
  presentHelp?: HelpPresenter;
  children: React.ReactNode;
};

export function XpShell({ screens, desktopExtras, help = {}, presentHelp, children }: Props) {
  const [startOpen, setStartOpen] = useState(false);

  return (
    <HelpProvider topics={help} present={presentHelp ?? null}>
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
    </HelpProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, position: 'relative' },
});
