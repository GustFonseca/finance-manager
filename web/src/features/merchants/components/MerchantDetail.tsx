import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, ColumnChart, Modal, MoneyText, StatTile } from '@/components/ui';
import { useTransactions } from '@/features/transactions/queries';
import { DateRange } from '@/features/transactions/types';
import { longMonthOf, shortMonthOf } from '@/lib/periods';
import { formatCents, formatCentsCompact } from '@/lib/money';
import { chart, colors, fontSize, spacing } from '@/theme';
import { useMerchantHistory } from '../queries';
import { kindLabel, MerchantDto } from '../types';

const RECENT_COUNT = 8;

type Props = {
  merchantId: string | null;
  range: DateRange;
  rangeLabel: string;
  onClose: () => void;
  onEdit: (merchant: MerchantDto) => void;
};

export function MerchantDetail({ merchantId, range, rangeLabel, onClose, onEdit }: Props) {
  const { data: history } = useMerchantHistory(merchantId, range);
  const { data: transactions = [] } = useTransactions({ ...range, merchantId: merchantId ?? undefined }, !!merchantId);
  const merchant = history?.merchant;

  return (
    <Modal visible={!!merchantId} onClose={onClose} icon="shopping-cart" title={merchant?.name ?? 'Estabelecimento'} width={640}>
      {history && merchant ? (
        <View style={styles.content}>
          <Text style={styles.meta}>
            {[kindLabel(merchant.kind), merchant.categoryName || 'sem categoria', merchant.document]
              .filter(Boolean)
              .join(' · ')}
          </Text>

          <View style={styles.tiles}>
            <StatTile
              label="Gasto no período"
              value={<MoneyText cents={history.expenseCents} tone="neutral" style={styles.tileValue} />}
              detail={`${history.count} transação(ões)`}
            />
            <StatTile
              label="Média por mês"
              value={<MoneyText cents={history.averageMonthlyCents} tone="neutral" style={styles.tileValue} />}
              detail="nos meses com gasto"
            />
            <StatTile
              label="Ticket médio"
              value={<MoneyText cents={history.averageTicketCents} tone="neutral" style={styles.tileValue} />}
            />
            {history.incomeCents > 0 ? (
              <StatTile
                label="Recebido"
                value={<MoneyText cents={history.incomeCents} tone="income" style={styles.tileValue} />}
              />
            ) : null}
          </View>

          <Text style={styles.section}>Gasto por mês, {rangeLabel}</Text>
          <ColumnChart
            formatValue={(v) => formatCentsCompact(v)}
            columns={history.months.map((m) => ({
              key: m.monthStart,
              label: shortMonthOf(m.monthStart),
              segments: [{ key: 'expense', value: m.expenseCents, color: chart.essential }],
              details: [
                longMonthOf(m.monthStart),
                `${formatCents(m.expenseCents)} em ${m.count} transação(ões)`,
              ],
            }))}
          />

          <Text style={styles.section}>Últimas transações</Text>
          {transactions.slice(0, RECENT_COUNT).map((t) => (
            <View key={t.id} style={styles.txnRow}>
              <View style={styles.txnInfo}>
                <Text style={styles.txnDate}>
                  {new Date(t.date).toLocaleDateString('pt-BR')} · {t.categoryName} · {t.accountName}
                </Text>
                <Text style={styles.txnDesc} numberOfLines={1}>
                  {t.description}
                </Text>
              </View>
              <MoneyText
                cents={t.type === 'EXPENSE' ? -t.amountCents : t.amountCents}
                tone={t.type === 'EXPENSE' ? 'expense' : 'income'}
                style={styles.txnValue}
              />
            </View>
          ))}

          <View style={styles.buttons}>
            <Button label="Editar..." variant="secondary" onPress={() => onEdit(merchant)} />
            <Button label="Fechar" variant="primary" onPress={onClose} />
          </View>
        </View>
      ) : (
        <Text style={styles.meta}>Carregando...</Text>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tileValue: { fontSize: fontSize.xl, fontWeight: '700' },
  section: { fontSize: fontSize.md, fontWeight: '700', color: colors.heading, marginTop: spacing.sm },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  txnInfo: { flex: 1, marginRight: spacing.md, minWidth: 0 },
  txnDate: { fontSize: fontSize.sm, color: colors.textPrimary },
  txnDesc: { fontSize: fontSize.xs, color: colors.textSecondary },
  txnValue: { fontSize: fontSize.sm, fontWeight: '700' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
});
