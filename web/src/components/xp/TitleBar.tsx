import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View, ViewProps } from 'react-native';
import { fonts, gradients, PressState, radius, webStyle } from '@/theme';

export type IconName = React.ComponentProps<typeof FontAwesome>['name'];

type Props = {
  title: string;
  icon?: IconName;
  active?: boolean;
  maximized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
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
      {icon ? <FontAwesome name={icon} size={14} color="#FFFFFF" style={styles.icon} /> : null}
      <Text style={[styles.title, { fontFamily: fonts.title }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.buttons}>
        {onMinimize ? <CaptionButton kind="minimize" onPress={onMinimize} /> : null}
        {onMaximize ? (
          <CaptionButton kind={maximized ? 'restore' : 'maximize'} onPress={onMaximize} />
        ) : null}
        {onClose ? <CaptionButton kind="close" onPress={onClose} /> : null}
      </View>
    </View>
  );
}

type CaptionKind = 'minimize' | 'maximize' | 'restore' | 'close';

const CAPTION_LABELS: Record<CaptionKind, string> = {
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
        return [
          styles.button,
          kind === 'close' ? styles.close : styles.blue,
          hovered && styles.buttonHover,
          pressed && styles.buttonPressed,
        ];
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
      return <Text style={styles.closeGlyph}>✕</Text>;
  }
}

const styles = StyleSheet.create({
  bar: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 4,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    ...webStyle({ userSelect: 'none' }),
  },
  draggable: webStyle({ cursor: 'move', touchAction: 'none' }),
  icon: { marginRight: 6 },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textShadowColor: '#0F1089',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  buttons: { flexDirection: 'row', gap: 2 },
  button: {
    width: 21,
    height: 21,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...webStyle({ cursor: 'pointer' }),
  },
  blue: webStyle({
    backgroundImage:
      'radial-gradient(circle at 90% 90%, #0054E9 0%, #2263D5 55%, #4479E4 70%, #A3BBEC 90%, #FFFFFF 100%)',
  }),
  close: webStyle({
    backgroundImage:
      'radial-gradient(circle at 90% 90%, #CC4600 0%, #DC6527 55%, #CD7546 70%, #FFCCB2 90%, #FFFFFF 100%)',
  }),
  buttonHover: webStyle({ filter: 'brightness(1.15)' }),
  buttonPressed: webStyle({ filter: 'brightness(0.85)' }),
  minimizeGlyph: {
    width: 7,
    height: 3,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginRight: 4,
  },
  maximizeGlyph: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: '#FFFFFF',
  },
  restoreGlyph: { width: 11, height: 11 },
  restoreBox: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderWidth: 1,
    borderTopWidth: 2,
    borderColor: '#FFFFFF',
  },
  restoreBack: { top: 0, right: 0 },
  restoreFront: { bottom: 0, left: 0, backgroundColor: '#2263D5' },
  closeGlyph: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, lineHeight: 15 },
});
