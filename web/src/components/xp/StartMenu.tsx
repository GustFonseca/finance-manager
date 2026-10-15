import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useDialog } from '@/components/ui/DialogProvider';
import { useAuth } from '@/features/auth/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { bevels, colors, fonts, fontSize, gradients, PressState, spacing, webStyle } from '@/theme';
import { PROGRAMS } from './programs';
import type { IconName } from './TitleBar';
import { useWindowManager } from './WindowManager';

export const TASKBAR_HEIGHT = 30;
const MENU_WIDTH = 400;

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * The two-column XP Start menu: programs on the left, utilities on the right,
 * "Fazer logoff" / "Desligar" in the footer.
 */
export function StartMenu({ visible, onClose }: Props) {
  const { user, signOut } = useAuth();
  const { open } = useWindowManager();
  const { alert, confirm } = useDialog();
  const { width } = useWindowDimensions();

  if (!visible) return null;

  // Every item closes the menu first, as in Windows.
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
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={[styles.userName, { fontFamily: fonts.title }]} numberOfLines={1}>
            {user?.name ?? 'Usuário'}
          </Text>
        </View>

        <View style={styles.body}>
          <View style={styles.left}>
            {PROGRAMS.map((program) => (
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
            <StartItem
              compact
              icon="refresh"
              color="#2E7D32"
              title="Atualizar dados"
              onPress={run(() => queryClient.invalidateQueries())}
            />
            <StartItem
              compact
              icon="question-circle"
              color="#1565C0"
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
          <FooterButton icon="key" color="#E8A317" label="Fazer logoff" onPress={run(signOut)} />
          <FooterButton icon="power-off" color="#D9381E" label="Desligar" onPress={run(shutDown)} />
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
            <FontAwesome name={icon} size={compact ? 18 : 24} color={color} style={styles.itemIcon} />
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
        <FontAwesome name={icon} size={13} color="#FFFFFF" />
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
    backgroundColor: '#4282D6',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    ...webStyle({ boxShadow: bevels.window }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    ...webStyle({ backgroundImage: gradients.startMenuHeader }),
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#E8A317',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 20 },
  userName: {
    flex: 1,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fontSize.lg,
    textShadowColor: '#0F1089',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  body: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#E1802E',
  },
  left: { flex: 1.2, backgroundColor: colors.surface, paddingVertical: spacing.xs },
  right: {
    flex: 1,
    backgroundColor: '#D3E5FA',
    borderLeftWidth: 1,
    borderLeftColor: '#95BDEE',
    paddingVertical: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 1,
    paddingHorizontal: spacing.sm,
    ...webStyle({ cursor: 'pointer' }),
  },
  itemHover: { backgroundColor: colors.selection },
  itemIcon: { width: 28, textAlign: 'center', marginRight: spacing.sm },
  itemText: { flex: 1 },
  itemTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  itemTitleCompact: { fontSize: fontSize.sm, fontWeight: '700', color: '#00136B' },
  itemDescription: { fontSize: fontSize.xs, color: colors.textMuted },
  textHover: { color: colors.textOnAccent },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    padding: spacing.xs + 2,
    ...webStyle({ backgroundImage: gradients.startMenuFooter }),
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: 3,
    ...webStyle({ cursor: 'pointer' }),
  },
  footerHover: { backgroundColor: 'rgba(255,255,255,0.15)' },
  footerIcon: {
    width: 22,
    height: 22,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLabel: { color: '#FFFFFF', fontSize: fontSize.sm },
});
