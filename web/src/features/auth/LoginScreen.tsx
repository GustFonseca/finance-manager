import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WindowsLogo } from '@/components/xp';
import { fonts, PressState, spacing, webStyle } from '@/theme';
import { useAuth } from './AuthContext';

export function LoginScreen() {
  const { signInWithGoogle } = useAuth();

  return (
    <View style={styles.screen}>
      <View style={styles.topBar} />
      <View style={styles.middle}>
        <View style={styles.brand}>
          <WindowsLogo size={56} />
          <Text style={[styles.product, { fontFamily: fonts.title }]}>Finance Manager</Text>
          <Text style={styles.hint}>Para começar, clique no seu nome de usuário</Text>
        </View>

        <View style={styles.users}>
          <Pressable
            onPress={signInWithGoogle}
            accessibilityRole="button"
            accessibilityLabel="Entrar com Google"
            style={(state) => [styles.tile, (state as PressState).hovered && styles.tileHover]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>G</Text>
            </View>
            <View>
              <Text style={[styles.userName, { fontFamily: fonts.title }]}>Entrar com Google</Text>
              <Text style={styles.userHint}>Use sua conta Google</Text>
            </View>
          </Pressable>
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
  screen: { flex: 1, backgroundColor: '#5A7EDC' },
  topBar: {
    height: 64,
    backgroundColor: '#00309C',
    ...webStyle({ boxShadow: '0 2px 0 #E1802E, 0 3px 0 #FFFFFF' }),
  },
  middle: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    ...webStyle({
      backgroundImage: 'radial-gradient(circle at 20% 20%, #91B2F0 0%, #6C8FE3 30%, #5A7EDC 70%)',
    }),
  },
  brand: { flexGrow: 1, flexBasis: 280, maxWidth: 360, alignItems: 'flex-end', gap: spacing.md },
  product: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 2,
  },
  hint: { color: '#FFFFFF', fontSize: 15, textAlign: 'right' },
  users: {
    flexGrow: 1,
    flexBasis: 280,
    maxWidth: 360,
    paddingLeft: spacing.lg,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.6)',
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: 8,
    ...webStyle({ cursor: 'pointer' }),
  },
  tileHover: {
    ...webStyle({
      backgroundImage: 'linear-gradient(to right, #00309C 0%, rgba(90,126,220,0) 100%)',
    }),
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 30, fontWeight: '700', color: '#4285F4' },
  userName: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  userHint: { color: '#D6E2FF', fontSize: 12 },
  bottomBar: {
    minHeight: 64,
    backgroundColor: '#00309C',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    ...webStyle({ boxShadow: '0 -2px 0 #5A7EDC, 0 -3px 0 #FFFFFF' }),
  },
  footer: { color: '#FFFFFF', fontSize: 12 },
});
