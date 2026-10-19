import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { isChunkLoadError } from '@/lib/lazyImport';
import { bevels, colors, fontSize, palette, spacing, webStyle } from '@/theme';
import { TitleBar } from './TitleBar';

export const WINDOW_UPDATED_MESSAGE = 'Esta janela foi atualizada. Recarregue para continuar.';

type Props = {
  title: string;
  zIndex: number;
  onClose: () => void;
  children: React.ReactNode;
};

type State = { error: Error | null };

export class WindowErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (!isChunkLoadError(error)) throw error;
    return <WindowUpdatedDialog title={this.props.title} zIndex={this.props.zIndex} onClose={this.props.onClose} />;
  }
}

function WindowUpdatedDialog({ title, zIndex, onClose }: { title: string; zIndex: number; onClose: () => void }) {
  return (
    <View style={[styles.overlay, { zIndex }]} pointerEvents="box-none">
      <View style={styles.window} accessibilityRole="alert">
        <TitleBar title={title} icon="exclamation-triangle" onClose={onClose} />
        <View style={styles.body}>
          <PixelIcon name="info-circle" size={32} color={colors.primary} />
          <Text style={styles.text}>{WINDOW_UPDATED_MESSAGE}</Text>
        </View>
        <View style={styles.buttons}>
          <Button label="Recarregar" onPress={() => location.reload()} />
          <Button label="Fechar janela" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  window: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: palette.sand,
    ...webStyle({ boxShadow: bevels.window }),
  },
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  text: { flex: 1, fontSize: fontSize.sm, color: colors.textPrimary },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, padding: spacing.md, paddingTop: 0 },
});
