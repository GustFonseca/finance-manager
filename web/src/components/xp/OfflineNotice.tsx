import React, { useEffect, useState } from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { StyleSheet, Text, View } from 'react-native';
import { bevels, colors, fontSize, palette, spacing, webStyle } from '@/theme';

export const OFFLINE_MESSAGE = 'Sem conexão — mostrando os últimos dados salvos';

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine !== false);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}

export function OfflineNotice() {
  const online = useOnline();
  if (online) return null;

  return (
    <View style={styles.notice} accessibilityRole="alert">
      <PixelIcon name="plug" size={14} color={palette.amber} />
      <Text style={styles.text}>{OFFLINE_MESSAGE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    position: 'absolute',
    top: spacing.sm,
    alignSelf: 'center',
    zIndex: 950,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.tealDark,
    borderLeftWidth: 4,
    borderLeftColor: palette.amber,
    ...webStyle({ boxShadow: bevels.menu }),
  },
  text: { fontSize: fontSize.sm, color: colors.textPrimary },
});
