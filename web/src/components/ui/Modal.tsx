import React from 'react';
import { Modal as RNModal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { TitleBar, IconName } from '@/components/xp/TitleBar';
import { bevels, colors, spacing, webStyle } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  icon?: IconName;
  /** Max width in px; dialogs are 420 by default, wizards wider. */
  width?: number;
  children: React.ReactNode;
};

/** XP dialog box: a small window with only the close button, centered. */
export function Modal({ visible, onClose, title, icon, width = 420, children }: Props) {
  return (
    <RNModal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Stop propagation so clicks inside the dialog don't dismiss it. */}
        <Pressable style={[styles.window, { maxWidth: width }]} onPress={() => {}}>
          <TitleBar title={title ?? ''} icon={icon} onClose={onClose} />
          <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
            <View>{children}</View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  window: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: colors.background,
    borderWidth: 3,
    borderTopWidth: 0,
    borderColor: colors.windowFrame,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    ...webStyle({ boxShadow: bevels.window, cursor: 'default' }),
  },
  scroll: { flexGrow: 0 },
  body: { padding: spacing.md },
});
