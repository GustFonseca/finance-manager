import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, ErrorState, MoneyText, MonthSelect, StatTile, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { ALL_ACCOUNTS, AccountSelect } from '@/features/accounts/components/AccountSelect';
import { MerchantDetail } from '@/features/merchants/components/MerchantDetail';
import { MerchantForm } from '@/features/merchants/components/MerchantForm';
import { useSetMerchantClass, useUpdateMerchant } from '@/features/merchants/queries';
import { MerchantDto, UpdateMerchantInput } from '@/features/merchants/types';
import { SpendingClass } from '@/features/spending/types';
import { getErrorMessage } from '@/lib/http';
import { formatCents } from '@/lib/money';
import { monthKeyOf, monthLabel, monthRange, twelveMonthsUntil } from '@/lib/periods';
import { workHoursOf } from '@/lib/workHours';
import { colors, fontSize, spacing } from '@/theme';
import { AvoidableRow, RowAction } from './components/AvoidableRow';
import { useAvoidableSpending } from './queries';

const day = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

export function formatRate(percent: number) {
  return `${percent.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

export function AvoidableScreen() {
  const { alert } = useDialog();
  const [monthKey, setMonthKey] = useState(() => monthKeyOf(new Date()));
  const [accountId, setAccountId] = useState(ALL_ACCOUNTS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<MerchantDto | null>(null);
  const month = useMemo(() => monthRange(monthKey), [monthKey]);
  const history = useMemo(() => twelveMonthsUntil(monthKey), [monthKey]);
  const { data, error, isFetching, refetch } = useAvoidableSpending({ ...month, accountId: accountId || undefined });
  const setClass = useSetMerchantClass();
  const updateMerchant = useUpdateMerchant();

  async function classify(merchantId: string, name: string, spendingClass: SpendingClass) {
    try {
      await setClass.mutateAsync({ id: merchantId, spendingClass });
      alert({
        title: 'Gastos evitáveis',
        message:
          spendingClass === 'ESSENTIAL'
            ? `${name} foi marcado como essencial e não aparece mais como gasto evitável.`
            : `${name} foi marcado como supérfluo e passa a contar como gasto evitável.`,
      });
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível classificar o estabelecimento') });
    }
  }

  async function handleSave(input: UpdateMerchantInput) {
    if (!editing) return;
    try {
      await updateMerchant.mutateAsync({ id: editing.id, data: input });
      setEditing(null);
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível salvar o estabelecimento') });
    }
  }

  function actions(merchantId: string | null, name: string, mark?: SpendingClass): RowAction[] {
    if (!merchantId) return [];
    const list: RowAction[] = [{ label: 'Ver detalhes', onPress: () => setOpenId(merchantId) }];
    if (mark === 'ESSENTIAL') list.push({ label: 'Não é desnecessário', onPress: () => classify(merchantId, name, 'ESSENTIAL') });
    if (mark === 'SUPERFLUOUS') list.push({ label: 'Marcar como supérfluo', onPress: () => classify(merchantId, name, 'SUPERFLUOUS') });
    return list;
  }

  const nothing =
    data &&
    data.superfluous.length === 0 &&
    data.subscriptions.length === 0 &&
    data.smallPurchases.merchants.length === 0 &&
    data.spikes.length === 0 &&
    data.firstTimePurchases.length === 0 &&
    data.fees.items.length === 0;

  return (
    <>
      <Window
        title="Gastos evitáveis"
        icon="scissors"
        onRefresh={refetch}
        status={isFetching ? 'Analisando...' : `Gastos evitáveis de ${monthLabel(monthKey)}`}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
          <View style={styles.filters}>
            <MonthSelect value={monthKey} onChange={setMonthKey} />
            <AccountSelect value={accountId} onChange={setAccountId} />
          </View>

          {error ? (
            <ErrorState error={error} fallback="Não foi possível carregar os gastos evitáveis" onRetry={refetch} />
          ) : data ? (
            <>
              <View style={styles.tiles}>
                <StatTile
                  label="Evitável neste mês"
                  value={<MoneyText cents={data.monthCents} tone="expense" style={styles.tileValue} />}
                  detail={['em gastos supérfluos', workHoursOf(data.monthCents, data.hourValueCents)].filter(Boolean).join(' · ')}
                />
                <StatTile
                  label="Em 12 meses"
                  value={<MoneyText cents={data.yearProjectionCents} tone="neutral" style={styles.tileValue} />}
                  detail={`no ritmo médio de ${formatCents(data.monthlyAverageCents)} por mês`}
                />
                <StatTile
                  label="Se investisse"
                  value={<MoneyText cents={data.investedIn12MonthsCents} tone="income" style={styles.tileValue} />}
                  detail={`em 12 meses a 100% do CDI (${formatRate(data.cdiAnnualPercent)} ao ano)`}
                />
              </View>

              {nothing ? <EmptyState message="Nenhum gasto evitável encontrado neste mês." /> : null}

              {data.fees.items.length > 0 ? (
                <Card title="Tarifas e juros">
                  <Text style={styles.lead}>
                    {formatCents(data.fees.monthCents)} neste mês e {formatCents(data.fees.yearCents)} nos últimos 12 meses só em
                    tarifas, juros e multas. Quase tudo isso dá para negociar, trocar por conta gratuita ou evitar pagando em dia.
                  </Text>
                  {data.fees.items.map((f) => (
                    <AvoidableRow
                      key={f.label}
                      title={f.label}
                      detail={`${f.count} cobrança(s) em 12 meses · última em ${day(f.lastDate)}`}
                      highlight={workHoursOf(f.yearCents, data.hourValueCents) ?? undefined}
                      value={`${formatCents(f.yearCents)} em 12 meses`}
                    />
                  ))}
                </Card>
              ) : null}

              {data.subscriptions.length > 0 ? (
                <Card title="Assinaturas">
                  {data.similarSubscriptions.map((group) => (
                    <Text key={group.group} style={styles.alert}>
                      {group.names.length} serviços de {group.group} ao mesmo tempo: {group.names.join(', ')} —{' '}
                      {formatCents(group.monthlyCents)} por mês.
                    </Text>
                  ))}
                  {data.subscriptions.map((s) => (
                    <AvoidableRow
                      key={s.merchantId ?? s.name}
                      title={s.name}
                      detail={`${s.group ?? 'Assinatura'} · ${formatCents(s.yearlyCents)} por ano · última cobrança em ${day(s.lastDate)} · investido: ${formatCents(s.investedIn12MonthsCents)} em 12 meses`}
                      highlight={[
                        s.priceIncreased && s.previousCents !== null
                          ? `Preço subiu de ${formatCents(s.previousCents)} para ${formatCents(s.monthlyCents)}`
                          : null,
                        s.resumedAfter ? `Voltou a cobrar depois de uma pausa (cobrança anterior em ${day(s.resumedAfter)})` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      value={`${formatCents(s.monthlyCents)}/mês`}
                      actions={actions(s.merchantId, s.name, 'ESSENTIAL')}
                    />
                  ))}
                </Card>
              ) : null}

              {data.smallPurchases.merchants.length > 0 ? (
                <Card title="Pequenos gastos que somam">
                  <Text style={styles.lead}>
                    {formatCents(data.smallPurchases.monthlyCents)} por mês em cerca de{' '}
                    {Math.round(data.smallPurchases.timesPerMonth)} compras abaixo de {formatCents(data.smallPurchases.limitCents)}.
                  </Text>
                  {data.smallPurchases.merchants.map((m) => (
                    <AvoidableRow
                      key={m.merchantId ?? m.name}
                      title={m.name}
                      detail={`${m.timesPerMonth.toLocaleString('pt-BR')} vezes por mês · ticket médio de ${formatCents(m.averageTicketCents)}`}
                      value={`${formatCents(m.monthlyCents)}/mês`}
                      actions={actions(m.merchantId, m.name, 'SUPERFLUOUS')}
                    />
                  ))}
                </Card>
              ) : null}

              {data.spikes.length > 0 ? (
                <Card title="Picos fora do normal">
                  {data.spikes.map((s) => (
                    <AvoidableRow
                      key={`${s.kind}-${s.id ?? s.name}`}
                      title={s.name}
                      detail={`${s.kind === 'CATEGORY' ? 'Categoria' : 'Estabelecimento'} · média de ${formatCents(s.averageCents)} por mês · normal até ${formatCents(s.thresholdCents)}`}
                      highlight={`${s.ratio.toLocaleString('pt-BR')}x a média`}
                      value={formatCents(s.monthCents)}
                      actions={s.kind === 'MERCHANT' ? actions(s.id, s.name) : []}
                    />
                  ))}
                </Card>
              ) : null}

              {data.firstTimePurchases.length > 0 ? (
                <Card title="Compras grandes pela primeira vez">
                  {data.firstTimePurchases.map((p) => (
                    <AvoidableRow
                      key={p.transactionId}
                      title={p.name}
                      detail={`${day(p.date)} · nenhuma compra neste lugar nos 12 meses anteriores`}
                      value={formatCents(p.cents)}
                      actions={actions(p.merchantId, p.name, p.class === 'SUPERFLUOUS' ? undefined : 'SUPERFLUOUS')}
                    />
                  ))}
                </Card>
              ) : null}

              {data.superfluous.length > 0 ? (
                <Card title="Supérfluos por estabelecimento">
                  {data.superfluous.map((m) => (
                    <AvoidableRow
                      key={m.merchantId ?? m.name}
                      title={m.name}
                      detail={`${m.categoryName} · ${m.count} compra(s) · média de ${formatCents(m.monthlyAverageCents)} por mês`}
                      highlight={[
                        `Cortando pela metade: ${formatCents(m.cutCents)} por mês, ${formatCents(m.cutInvestedIn12MonthsCents)} investidos em 12 meses`,
                        workHoursOf(m.monthCents, data.hourValueCents),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      value={formatCents(m.monthCents)}
                      actions={actions(m.merchantId, m.name, 'ESSENTIAL')}
                    />
                  ))}
                </Card>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </Window>

      <MerchantDetail
        merchantId={openId}
        range={history}
        rangeLabel={`12 meses até ${monthLabel(monthKey)}`}
        onClose={() => setOpenId(null)}
        onEdit={(merchant) => setEditing(merchant)}
      />
      <MerchantForm merchant={editing} saving={updateMerchant.isPending} onClose={() => setEditing(null)} onSubmit={handleSave} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  filters: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.md },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tileValue: { fontSize: fontSize.xxl - 2, fontWeight: '700' },
  alert: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    backgroundColor: '#FFFFE1',
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  lead: { fontSize: fontSize.md, color: colors.textPrimary, marginBottom: spacing.xs },
});
