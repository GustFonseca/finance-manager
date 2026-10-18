import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { SavingsSuggestionDto, SuggestionKind } from '../types';

const KINDS: Record<
  SuggestionKind,
  { icon: 'flag' | 'exclamation-triangle' | 'play-circle' | 'scissors' | 'shopping-cart' | 'tags'; color: string }
> = {
  GOAL: { icon: 'flag', color: '#1565C0' },
  BUDGET: { icon: 'exclamation-triangle', color: '#E8A317' },
  SUBSCRIPTION: { icon: 'play-circle', color: '#C62828' },
  CATEGORY: { icon: 'scissors', color: '#2E7D32' },
  HABIT: { icon: 'shopping-cart', color: '#00838F' },
  ORGANIZE: { icon: 'tags', color: '#EF6C00' },
};

/** The automatic analysis: what is off track and what could be cut, with the monthly savings. */
export function SuggestionList({
  suggestions,
  historyMonths,
}: {
  suggestions: SavingsSuggestionDto[];
  /** Previous months with transactions; without any, there is nothing to compare with. */
  historyMonths: number;
}) {
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
        // Goal gaps aren't savings in themselves, so only cuts show "por mês".
        const showSavings = suggestion.potentialCents > 0 && suggestion.kind !== 'GOAL';
        return (
          <View key={suggestion.title} style={styles.row}>
            <FontAwesome name={kind.icon} size={16} color={kind.color} style={styles.icon} />
            <View style={styles.info}>
              <Text style={styles.title}>{suggestion.title}</Text>
              <Text style={styles.detail}>{suggestion.detail}</Text>
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
    borderBottomColor: '#EFEFE7',
  },
  icon: { width: 18, textAlign: 'center', marginTop: 1 },
  info: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  detail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  savings: { fontSize: fontSize.md, fontWeight: '700', color: colors.income },
});
