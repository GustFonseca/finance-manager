import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, gradients, PressState, spacing, webStyle } from '@/theme';
import { PROGRAMS } from './programs';
import { useWindowManager } from './WindowManager';

/** Wallpaper with one shortcut icon per program; windows render on top. */
export function Desktop({ children }: { children: React.ReactNode }) {
  const { open } = useWindowManager();

  return (
    <View style={styles.desktop}>
      <View style={styles.icons}>
        {PROGRAMS.map((program) => (
          <Pressable
            key={program.route}
            onPress={() => open(program.route)}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${program.title}`}
            style={styles.icon}>
            {(state) => {
              const { hovered } = state as PressState;
              return (
                <>
                  <View style={styles.iconTile}>
                    <FontAwesome name={program.icon} size={26} color={program.color} />
                  </View>
                  <Text style={[styles.iconLabel, hovered && styles.iconLabelHover]}>
                    {program.title}
                  </Text>
                </>
              );
            }}
          </Pressable>
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  desktop: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    ...webStyle({ backgroundImage: gradients.wallpaper, backgroundColor: '#5A9A2E' }),
  },
  icons: { padding: spacing.sm, gap: spacing.md, alignItems: 'center', width: 88 },
  icon: { width: 76, alignItems: 'center', gap: 3, ...webStyle({ cursor: 'pointer' }) },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...webStyle({ boxShadow: '1px 1px 3px rgba(0,0,0,0.4)' }),
  },
  iconLabel: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    textAlign: 'center',
    paddingHorizontal: 2,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  iconLabelHover: { backgroundColor: '#0B61FF', textShadowColor: 'transparent' },
});
