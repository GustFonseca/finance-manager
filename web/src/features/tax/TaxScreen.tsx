import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, ErrorState, MoneyText, StatTile, useDialog, YearSelect } from '@/components/ui';
import { Window } from '@/components/xp';
import { colors, fontSize, spacing } from '@/theme';
import { PartyRow } from './components/PartyRow';
import { useTaxReport } from './queries';
import { buildTaxSummary } from './summary';
import { TaxReportDto } from './types';

export const TAX_NOTE =
  'Este resumo é montado a partir das suas transações e serve como ponto de partida. Confira cada valor com os comprovantes, informes de rendimentos e os limites oficiais da Receita Federal antes de declarar.';

export function TaxScreen() {
  const { alert } = useDialog();
  const [year, setYear] = useState(() => new Date().getFullYear() - 1);
  const { data, error, isFetching, refetch } = useTaxReport(year);

  async function copySummary(report: TaxReportDto) {
    const text = buildTaxSummary(report);
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      alert({ title: 'Imposto de Renda', message: 'Resumo copiado. Cole onde preferir para consultar na hora de declarar.' });
    } catch {
      alert({ title: 'Erro', message: 'Não foi possível copiar o resumo. Seu navegador não permitiu o acesso à área de transferência.' });
    }
  }

  return (
    <Window
      title="Imposto de Renda"
      icon="file-text-o"
      onRefresh={refetch}
      status={isFetching ? 'Atualizando...' : `Ano-calendário ${year}`}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
        <View style={styles.header}>
          <YearSelect value={year} onChange={setYear} />
          {data ? <Button label="Copiar resumo" onPress={() => copySummary(data)} /> : null}
        </View>

        {error ? (
          <ErrorState error={error} fallback="Não foi possível montar o resumo do Imposto de Renda" onRetry={refetch} />
        ) : data ? (
          <>
            <View style={styles.tiles}>
              <StatTile
                label="Rendimentos recebidos"
                value={<MoneyText cents={data.incomeCents} tone="income" style={styles.tileValue} />}
              />
              <StatTile
                label="Despesas no ano"
                value={<MoneyText cents={data.expenseCents} tone="expense" style={styles.tileValue} />}
              />
              <StatTile
                label="Possíveis deduções"
                value={<MoneyText cents={data.deductibleCents} tone="neutral" style={styles.tileValue} />}
                detail="saúde, educação e outras despesas dedutíveis"
              />
            </View>

            <Text style={styles.note}>{TAX_NOTE}</Text>

            <Card title="Rendimentos por fonte pagadora">
              {data.incomes.length === 0 ? (
                <Text style={styles.empty}>Nenhum rendimento encontrado em {data.year}.</Text>
              ) : (
                data.incomes.map((party, index) => <PartyRow key={`${index}-${party.name}`} party={party} />)
              )}
            </Card>

            <Card title="Despesas possivelmente dedutíveis">
              {data.deductibles.length === 0 ? (
                <Text style={styles.empty}>Nenhuma despesa dedutível encontrada em {data.year}.</Text>
              ) : (
                data.deductibles.map((group) => (
                  <View key={group.label} style={styles.group}>
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupLabel}>{group.label}</Text>
                      <MoneyText cents={group.cents} tone="neutral" style={styles.groupLabel} />
                    </View>
                    {group.providers.map((party, index) => (
                      <PartyRow key={`${index}-${party.name}`} party={party} />
                    ))}
                  </View>
                ))
              )}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Window>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tileValue: { fontSize: fontSize.xxl - 2, fontWeight: '700' },
  note: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    backgroundColor: '#FFFFE1',
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  empty: { fontSize: fontSize.sm, color: colors.textSecondary, fontStyle: 'italic' },
  group: { marginBottom: spacing.md },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.xs,
  },
  groupLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
});
