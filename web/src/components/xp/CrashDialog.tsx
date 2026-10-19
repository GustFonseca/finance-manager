import React, { useEffect, useState } from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { reportError } from '@/lib/logger';
import { bevels, colors, fontSize, gradients, palette, spacing, webStyle } from '@/theme';
import { TitleBar } from './TitleBar';

type Props = {
  error: Error;
  retry: () => void;
};

export function CrashDialog({ error, retry }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => reportError(error), [error]);

  return (
    <View style={styles.screen}>
      <View style={styles.window}>
        <TitleBar title="Finance Manager" icon="exclamation-triangle" />
        <View style={styles.header}>
          <Text style={styles.headline}>
            O Finance Manager encontrou um problema e precisa ser fechado.
          </Text>
          <Text style={styles.text}>Lamentamos o inconveniente.</Text>
          <PixelIcon name="times-circle" size={32} color={colors.expense} style={styles.icon} />
        </View>
        <View style={styles.body}>
          <Text style={styles.text}>
            Um relatório de erros foi enviado automaticamente para ajudar a corrigir o problema.
            Os seus dados estão salvos.
          </Text>
          <Text style={styles.link} onPress={() => setShowDetails((value) => !value)}>
            {showDetails ? 'Ocultar detalhes' : 'Clique aqui para ver os detalhes do erro.'}
          </Text>
          {showDetails ? (
            <Text style={styles.details} selectable>
              {`${error.name}: ${error.message}`}
            </Text>
          ) : null}
        </View>
        <View style={styles.buttons}>
          <Button label="Reiniciar" onPress={retry} />
          <Button label="Recarregar página" variant="secondary" onPress={() => location.reload()} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.desktop,
    ...webStyle({ backgroundImage: gradients.wallpaper }),
  },
  window: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: palette.sand,
    ...webStyle({ boxShadow: bevels.window }),
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    paddingRight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headline: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  icon: { position: 'absolute', right: spacing.md, top: spacing.md },
  body: { padding: spacing.md, gap: spacing.sm },
  text: { fontSize: fontSize.sm, color: colors.textPrimary },
  link: { fontSize: fontSize.sm, color: colors.link, textDecorationLine: 'underline', ...webStyle({ cursor: 'pointer' }) },
  details: {
    fontSize: fontSize.xs,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: spacing.sm,
    ...webStyle({ fontFamily: 'Consolas, "Courier New", monospace' }),
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: 0,
  },
});
