import React from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useDialog } from '@/components/ui/DialogProvider';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/features/auth/AuthContext';
import { useProfile } from '@/features/profile/queries';
import { queryClient } from '@/lib/queryClient';
import { bevels, colors, fonts, fontSize, gradients, palette, PressState, spacing, webStyle } from '@/theme';
import type { IconName } from './TitleBar';
import { useVisiblePrograms } from './useVisiblePrograms';
import { useWindowManager } from './WindowManager';

export const TASKBAR_HEIGHT = 30;
const MENU_WIDTH = 400;
const ACCOUNT_ROUTE = '/account';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function StartMenu({ visible, onClose }: Props) {
  const { user, signOut } = useAuth();
  const { open } = useWindowManager();
  const { alert, confirm } = useDialog();
  const { width } = useWindowDimensions();
  const programs = useVisiblePrograms();
  const profile = useProfile().data;

  if (!visible) return null;

  const mainPrograms = programs.filter((program) => !program.startMenuOnly);
  const sidePrograms = programs.filter((program) => program.startMenuOnly);

  const run = (action: () => void) => () => {
    onClose();
    action();
  };

  async function shutDown() {
    const ok = await confirm({
      title: 'Desligar o computador',
      message: 'Deseja encerrar a sessão e sair do Finance Manager?',
      confirmLabel: 'Desligar',
      destructive: true,
    });
    if (ok) signOut();
  }

  return (
    <>
      <Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="Fechar menu Iniciar" />
      <View style={[styles.menu, { width: Math.min(MENU_WIDTH, width) }]}>
        <Pressable
          style={styles.header}
          onPress={run(() => open(ACCOUNT_ROUTE))}
          accessibilityRole="button"
          accessibilityLabel="Abrir Minha conta">
          <UserAvatar name={user?.name} icon={profile?.avatarIcon} color={profile?.avatarColor} size={40} />
          <Text style={[styles.userName, { fontFamily: fonts.pixel }]} numberOfLines={1}>
            {user?.name ?? 'Usuário'}
          </Text>
        </Pressable>

        <View style={styles.body}>
          <View style={styles.left}>
            {mainPrograms.map((program) => (
              <StartItem
                key={program.route}
                icon={program.icon}
                color={program.color}
                title={program.title}
                description={program.description}
                onPress={run(() => open(program.route))}
              />
            ))}
          </View>
          <View style={styles.right}>
            {sidePrograms.map((program) => (
              <StartItem
                key={program.route}
                compact
                icon={program.icon}
                color={program.color}
                title={program.title}
                onPress={run(() => open(program.route))}
              />
            ))}
            <View style={styles.separator} />
            <StartItem
              compact
              icon="refresh"
              color={palette.green}
              title="Atualizar dados"
              onPress={run(() => queryClient.invalidateQueries())}
            />
            <StartItem
              compact
              icon="question-circle"
              color={palette.teal}
              title="Ajuda e suporte"
              onPress={run(() =>
                alert({
                  title: 'Ajuda e suporte',
                  message:
                    'Abra os programas pelo menu Iniciar ou pelos ícones da área de trabalho. ' +
                    'Use o menu Arquivo de cada janela para criar registros.',
                })
              )}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <FooterButton icon="key" color={palette.amber} label="Fazer logoff" onPress={run(signOut)} />
          <FooterButton icon="power-off" color={palette.coral} label="Desligar" onPress={run(shutDown)} />
        </View>
      </View>
    </>
  );
}

type StartItemProps = {
  icon: IconName;
  color: string;
  title: string;
  description?: string;
  compact?: boolean;
  onPress: () => void;
};

function StartItem({ icon, color, title, description, compact, onPress }: StartItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={(state) => [styles.item, (state as PressState).hovered && styles.itemHover]}>
      {(state) => {
        const hovered = (state as PressState).hovered;
        return (
          <>
            <PixelIcon name={icon} size={compact ? 18 : 24} color={color} style={styles.itemIcon} />
            <View style={styles.itemText}>
              <Text
                style={[
                  compact ? styles.itemTitleCompact : styles.itemTitle,
                  hovered && styles.textHover,
                ]}>
                {title}
              </Text>
              {description ? (
                <Text style={[styles.itemDescription, hovered && styles.textHover]} numberOfLines={1}>
                  {description}
                </Text>
              ) : null}
            </View>
          </>
        );
      }}
    </Pressable>
  );
}

type FooterButtonProps = { icon: IconName; color: string; label: string; onPress: () => void };

function FooterButton({ icon, color, label, onPress }: FooterButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={(state) => [styles.footerButton, (state as PressState).hovered && styles.footerHover]}>
      <View style={[styles.footerIcon, { backgroundColor: color }]}>
        <PixelIcon name={icon} size={13} color={colors.textOnAccent} />
      </View>
      <Text style={styles.footerLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dismiss: webStyle({ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 900 }),
  menu: {
    position: 'absolute',
    left: 0,
    bottom: TASKBAR_HEIGHT,
    zIndex: 1000,
    backgroundColor: palette.sand,
    padding: 2,
    overflow: 'hidden',
    ...webStyle({ boxShadow: bevels.window }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    ...webStyle({ backgroundImage: gradients.startMenuHeader, cursor: 'pointer' }),
  },
  separator: {
    height: 1,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.sm,
    backgroundColor: palette.stoneDark,
  },
  userName: {
    flex: 1,
    color: colors.textOnAccent,
    fontWeight: '600',
    fontSize: fontSize.xl,
  },
  body: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: palette.amber,
  },
  left: { flex: 1.2, backgroundColor: colors.surface, paddingVertical: spacing.xs },
  right: {
    flex: 1,
    backgroundColor: palette.sandLight,
    borderLeftWidth: 1,
    borderLeftColor: palette.stone,
    paddingVertical: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 1,
    paddingHorizontal: spacing.sm,
    ...webStyle({ cursor: 'pointer' }),
  },
  itemHover: { backgroundColor: colors.primary },
  itemIcon: { width: 28, textAlign: 'center', marginRight: spacing.sm },
  itemText: { flex: 1 },
  itemTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  itemTitleCompact: { fontSize: fontSize.sm, fontWeight: '700', color: colors.heading },
  itemDescription: { fontSize: fontSize.xs, color: colors.textMuted },
  textHover: { color: colors.textOnAccent },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    padding: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: palette.stoneDark,
    ...webStyle({ backgroundImage: gradients.startMenuFooter }),
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    ...webStyle({ cursor: 'pointer' }),
  },
  footerHover: webStyle({ backgroundImage: gradients.button, boxShadow: bevels.button }),
  footerIcon: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: palette.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLabel: { color: colors.textPrimary, fontSize: fontSize.sm },
});
