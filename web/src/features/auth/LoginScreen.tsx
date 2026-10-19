import React from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RetroMark, TitleBar, WAKE_MESSAGE } from '@/components/xp';
import { useServerWaking } from '@/lib/serverWake';
import {
  bevels,
  colors,
  fonts,
  fontSize,
  gradients,
  palette,
  PressState,
  spacing,
  webStyle,
} from '@/theme';
import { useAuth } from './AuthContext';

export function LoginScreen() {
  const { signInWithGoogle, error } = useAuth();
  const waking = useServerWaking();

  return (
    <View style={styles.screen}>
      <View style={styles.middle}>
        <View style={styles.window}>
          <TitleBar title="Finance Manager" icon="key" />
          <View style={styles.body}>
            <View style={styles.brand}>
              <RetroMark size={64} />
              <Text style={[styles.product, { fontFamily: fonts.pixel }]}>Finance Manager</Text>
              <Text style={styles.hint}>Para começar, clique no seu nome de usuário</Text>
            </View>

            <Pressable
              onPress={signInWithGoogle}
              accessibilityRole="button"
              accessibilityLabel="Entrar com Google"
              style={(state) => {
                const { hovered, pressed } = state as PressState;
                return [styles.tile, hovered && styles.tileHover, pressed && styles.tilePressed];
              }}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>G</Text>
              </View>
              <View style={styles.tileText}>
                <Text style={styles.userName}>Entrar com Google</Text>
                <Text style={styles.userHint}>Use sua conta Google</Text>
              </View>
              <PixelIcon name="chevron-right" size={12} color={colors.textSecondary} />
            </Pressable>

            {error ? (
              <View style={[styles.toast, styles.toastError]}>
                <PixelIcon name="exclamation-triangle" size={16} color={palette.amber} />
                <Text style={styles.toastText} accessibilityRole="alert">
                  {error}
                </Text>
              </View>
            ) : null}
            {waking ? (
              <View style={styles.toast}>
                <PixelIcon name="info-circle" size={16} color={palette.teal} />
                <Text style={styles.toastText}>{WAKE_MESSAGE}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      <View style={styles.bottomBar}>
        <Text style={styles.footer}>
          Depois de fazer logon, você pode abrir os programas pelo menu Iniciar.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.desktop,
    ...webStyle({ backgroundImage: gradients.wallpaper }),
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  window: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: palette.sand,
    padding: 2,
    ...webStyle({ boxShadow: bevels.window }),
  },
  body: {
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  brand: { alignItems: 'center', gap: spacing.sm },
  product: {
    color: colors.heading,
    fontSize: 30,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  hint: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center' },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    backgroundColor: palette.sandLight,
    ...webStyle({ backgroundImage: gradients.button, boxShadow: bevels.buttonDefault, cursor: 'pointer' }),
  },
  tileHover: webStyle({ boxShadow: bevels.buttonHover }),
  tilePressed: webStyle({ backgroundImage: gradients.buttonPressed, boxShadow: bevels.buttonPressed }),
  avatar: {
    width: 44,
    height: 44,
    backgroundColor: palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
    ...webStyle({ boxShadow: bevels.sunken }),
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: palette.teal },
  tileText: { flex: 1 },
  userName: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' },
  userHint: { color: colors.textSecondary, fontSize: fontSize.sm },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.tealDark,
    borderLeftWidth: 4,
    borderLeftColor: palette.teal,
    ...webStyle({ boxShadow: bevels.menu }),
  },
  toastError: { borderLeftColor: palette.amber },
  toastText: { flex: 1, color: colors.textPrimary, fontSize: fontSize.sm },
  bottomBar: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: palette.stone,
    ...webStyle({ backgroundImage: gradients.taskbar, boxShadow: bevels.taskbar }),
  },
  footer: { color: colors.textPrimary, fontSize: fontSize.sm, textAlign: 'center' },
});
