import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { useWindowManager } from '@/components/xp';
import { formatCents } from '@/lib/money';
import { colors, fontSize, palette, spacing } from '@/theme';
import { SavingsSuggestionDto, SuggestionKind } from '../types';

const KINDS: Record<
  SuggestionKind,
  { icon: 'flag' | 'exclamation-triangle' | 'play-circle' | 'scissors' | 'shopping-cart' | 'tags'; color: string }
> = {
  GOAL: { icon: 'flag', color: palette.navy },
  BUDGET: { icon: 'exclamation-triangle', color: palette.amber },
  SUBSCRIPTION: { icon: 'play-circle', color: '#C62828' },
  CATEGORY: { icon: 'scissors', color: palette.green },
  HABIT: { icon: 'shopping-cart', color: palette.sky },
  ORGANIZE: { icon: 'tags', color: palette.coral },
};

export function SuggestionList({
  suggestions,
  historyMonths,
}: {
  suggestions: SavingsSuggestionDto[];
  historyMonths: number;
}) {
  const wm = useWindowManager();
  if (suggestions.length === 0) {
    return (
      <Text style={styles.empty}>
        {historyMonths === 0
          ? 'Não há transações nos 3 meses anteriores, então ainda não há com o que comparar. ' +
            'Importe os extratos desses meses em Transações > Importar extrato para receber as sugestões.'
          : 'Nenhum ajuste necessário: seus gastos estão dentro do esperado.'}
      </Text>
    );
  }

  return (
    <View>
      {suggestions.map((suggestion) => {
        const kind = KINDS[suggestion.kind];
        const showSavings = suggestion.potentialCents > 0 && suggestion.kind !== 'GOAL';
        return (
          <View key={suggestion.title} style={styles.row}>
            <FontAwesome name={kind.icon} size={16} color={kind.color} style={styles.icon} />
            <View style={styles.info}>
              <Text style={styles.title}>{suggestion.title}</Text>
              <Text style={styles.detail}>{suggestion.detail}</Text>
              {suggestion.kind === 'ORGANIZE' ? (
                <View style={styles.action}>
                  <Button size="sm" label="Abrir Estabelecimentos" onPress={() => wm.open('/merchants')} />
                </View>
              ) : null}
            </View>
            {showSavings ? (
              <Text style={styles.savings}>{formatCents(suggestion.potentialCents)}/mês</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textSecondary, fontStyle: 'italic', fontSize: fontSize.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  icon: { width: 18, textAlign: 'center', marginTop: 1 },
  info: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  detail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  savings: { fontSize: fontSize.md, fontWeight: '700', color: colors.income },
  action: { flexDirection: 'row', marginTop: spacing.xs },
});
