import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View, ViewProps } from 'react-native';
import { bevels, colors, fonts, gradients, palette, PressState, webStyle } from '@/theme';

export type IconName = React.ComponentProps<typeof FontAwesome>['name'];

type Props = {
  title: string;
  icon?: IconName;
  active?: boolean;
  maximized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  onHelp?: () => void;
  onPointerDown?: ViewProps['onPointerDown'];
  draggable?: boolean;
};

export function TitleBar({
  title,
  icon,
  active = true,
  maximized,
  onMinimize,
  onMaximize,
  onClose,
  onHelp,
  onPointerDown,
  draggable,
}: Props) {
  return (
    <View
      onPointerDown={onPointerDown}
      style={[
        styles.bar,
        draggable && styles.draggable,
        webStyle({ backgroundImage: active ? gradients.titleBar : gradients.titleBarInactive }),
      ]}>
      {icon ? <FontAwesome name={icon} size={14} color={colors.textOnAccent} style={styles.icon} /> : null}
      <Text style={[styles.title, { fontFamily: fonts.body }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.buttons}>
        {onHelp ? <CaptionButton kind="help" onPress={onHelp} /> : null}
        {onMinimize ? <CaptionButton kind="minimize" onPress={onMinimize} /> : null}
        {onMaximize ? (
          <CaptionButton kind={maximized ? 'restore' : 'maximize'} onPress={onMaximize} />
        ) : null}
        {onClose ? <CaptionButton kind="close" onPress={onClose} /> : null}
      </View>
    </View>
  );
}

type CaptionKind = 'help' | 'minimize' | 'maximize' | 'restore' | 'close';

const CAPTION_LABELS: Record<CaptionKind, string> = {
  help: 'Como funciona',
  minimize: 'Minimizar',
  maximize: 'Maximizar',
  restore: 'Restaurar',
  close: 'Fechar',
};

function CaptionButton({ kind, onPress }: { kind: CaptionKind; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={CAPTION_LABELS[kind]}
      style={(state) => {
        const { hovered, pressed } = state as PressState;
        return [styles.button, hovered && styles.buttonHover, pressed && styles.buttonPressed];
      }}>
      <CaptionGlyph kind={kind} />
    </Pressable>
  );
}

function CaptionGlyph({ kind }: { kind: CaptionKind }) {
  switch (kind) {
    case 'minimize':
      return <View style={styles.minimizeGlyph} />;
    case 'maximize':
      return <View style={styles.maximizeGlyph} />;
    case 'restore':
      return (
        <View style={styles.restoreGlyph}>
          <View style={[styles.restoreBox, styles.restoreBack]} />
          <View style={[styles.restoreBox, styles.restoreFront]} />
        </View>
      );
    case 'close':
      return <Text style={styles.glyphText}>✕</Text>;
    case 'help':
      return <Text style={styles.glyphText}>?</Text>;
  }
}

const GLYPH = colors.textPrimary;

const styles = StyleSheet.create({
  bar: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 4,
    ...webStyle({ userSelect: 'none' }),
  },
  draggable: webStyle({ cursor: 'move', touchAction: 'none' }),
  icon: { marginRight: 6 },
  title: {
    flex: 1,
    color: colors.textOnAccent,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  buttons: { flexDirection: 'row', gap: 3 },
  button: {
    width: 20,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.sandLight,
    ...webStyle({ backgroundImage: gradients.button, boxShadow: bevels.button, cursor: 'pointer' }),
  },
  buttonHover: webStyle({ boxShadow: bevels.buttonHover }),
  buttonPressed: webStyle({ backgroundImage: gradients.buttonPressed, boxShadow: bevels.sunken }),
  minimizeGlyph: {
    width: 8,
    height: 2,
    backgroundColor: GLYPH,
    marginTop: 8,
  },
  maximizeGlyph: {
    width: 10,
    height: 9,
    borderWidth: 1,
    borderTopWidth: 2,
    borderColor: GLYPH,
  },
  restoreGlyph: { width: 11, height: 11 },
  restoreBox: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderWidth: 1,
    borderTopWidth: 2,
    borderColor: GLYPH,
  },
  restoreBack: { top: 0, right: 0 },
  restoreFront: { bottom: 0, left: 0, backgroundColor: palette.sandLight },
  glyphText: { color: GLYPH, fontWeight: '700', fontSize: 11, lineHeight: 13 },
});
