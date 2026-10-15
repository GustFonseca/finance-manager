import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, gradients, PressState, spacing, webStyle } from '@/theme';
import { PROGRAMS } from './programs';
import { useWindowManager, WindowRouteProvider } from './WindowManager';

export type ProgramScreens = Record<string, React.ComponentType>;

type Props = {
  /** Screen component for each program route; every open one is rendered as a window. */
  screens: ProgramScreens;
  children: React.ReactNode;
};

/** Wallpaper with one shortcut icon per program, and every open window on top. */
export function Desktop({ screens, children }: Props) {
  const { open, openRoutes } = useWindowManager();

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
      {openRoutes.map((route) => {
        const Screen = screens[route];
        return Screen ? (
          <WindowRouteProvider key={route} value={route}>
            <Screen />
          </WindowRouteProvider>
        ) : null;
      })}
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
