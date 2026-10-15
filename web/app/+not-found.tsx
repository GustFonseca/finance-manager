import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, fontSize } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta tela não existe.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Voltar para o início</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.textPrimary },
  link: { marginTop: spacing.lg, paddingVertical: spacing.lg },
  linkText: { fontSize: fontSize.sm, color: colors.primary },
});
