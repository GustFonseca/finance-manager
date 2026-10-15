import React from 'react';
import {
  Modal as RNModal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, fontSize } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** `center` for dialogs, `bottom` for sheet-like forms. */
  position?: 'center' | 'bottom';
  children: React.ReactNode;
};

export function Modal({ visible, onClose, title, position = 'center', children }: Props) {
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[styles.overlay, position === 'bottom' ? styles.overlayBottom : styles.overlayCenter]}
        onPress={onClose}>
        {/* Stop propagation so taps inside the card don't dismiss the modal. */}
        <Pressable
          style={[styles.card, position === 'bottom' && styles.cardBottom]}
          onPress={() => {}}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay },
  overlayCenter: { justifyContent: 'center', padding: spacing.xl },
  overlayBottom: { justifyContent: 'flex-end' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  cardBottom: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
});
