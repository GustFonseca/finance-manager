import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing, webStyle } from '@/theme';

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
      <FontAwesome name="plug" size={14} color={colors.textPrimary} />
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
    backgroundColor: '#FFFFE1',
    borderWidth: 1,
    borderColor: colors.textPrimary,
    borderRadius: radius.md,
    ...webStyle({ boxShadow: '2px 2px 3px rgba(0,0,0,0.25)' }),
  },
  text: { fontSize: fontSize.sm, color: colors.textPrimary },
});
