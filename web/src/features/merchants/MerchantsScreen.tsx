import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  Card,
  Input,
  MoneyText,
  MonthSelect,
  Select,
  StatTile,
  YearSelect,
  monthKeyOf,
  monthLabel,
  monthRange,
  useDialog,
  yearRange,
} from '@/components/ui';
import { Window } from '@/components/xp';
import { ALL_ACCOUNTS, AccountSelect } from '@/features/accounts/components/AccountSelect';
import { useAccounts } from '@/features/accounts/queries';
import { normalizeText } from '@/features/import/text';
import { getErrorMessage } from '@/lib/http';
import { formatCents } from '@/lib/money';
import { fontSize, spacing } from '@/theme';
import { MerchantDetail } from './components/MerchantDetail';
import { MerchantForm } from './components/MerchantForm';
import { MerchantTable } from './components/MerchantTable';
import { useMerchantSpending, useUpdateMerchant } from './queries';
import { MerchantDto, UpdateMerchantInput } from './types';

type Grouping = 'month' | 'year';

/** "Estabelecimentos": how much went to each place in a month or a year, and each one over time. */
export function MerchantsScreen() {
  const { alert } = useDialog();
  const { data: accounts = [] } = useAccounts();
  const [grouping, setGrouping] = useState<Grouping>('month');
  const [monthKey, setMonthKey] = useState(() => monthKeyOf(new Date()));
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [accountId, setAccountId] = useState(ALL_ACCOUNTS);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<MerchantDto | null>(null);
  const updateMerchant = useUpdateMerchant();

  // Memoized so the query keys stay stable across renders.
  const period = useMemo(
    () => (grouping === 'month' ? monthRange(monthKey) : yearRange(year)),
    [grouping, monthKey, year]
  );
  // The detail shows twelve months: the year, or the year up to the chosen month.
  const history = useMemo(() => {
    if (grouping === 'year') return yearRange(year);
    const [y, m] = monthKey.split('-').map(Number);
    return { start: new Date(y, m - 12, 1).toISOString(), end: monthRange(monthKey).end };
  }, [grouping, monthKey, year]);

  const { data, isFetching, refetch } = useMerchantSpending({ ...period, accountId: accountId || undefined });
  const periodName = grouping === 'month' ? monthLabel(monthKey) : String(year);
  const accountName = accounts.find((a) => a.id === accountId)?.name ?? 'todas as contas';

  const query = normalizeText(search.trim());
  const merchants = (data?.merchants ?? []).filter((m) => !query || normalizeText(m.name).includes(query));
  const top = data?.merchants[0];

  async function handleSave(input: UpdateMerchantInput) {
    if (!editing) return;
    try {
      const result = await updateMerchant.mutateAsync({ id: editing.id, data: input });
      setEditing(null);
      if (result.updatedTransactions > 0) {
        alert({
          title: 'Estabelecimento atualizado',
          message: `${result.updatedTransactions} transação(ões) movida(s) para ${result.merchant.categoryName}.`,
        });
      }
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível salvar o estabelecimento') });
    }
  }

  return (
    <>
      <Window
        title="Estabelecimentos"
        icon="shopping-cart"
        onRefresh={refetch}
        status={
          isFetching
            ? 'Atualizando...'
            : `${data?.merchants.length ?? 0} estabelecimento(s) · ${periodName} · ${accountName}`
        }>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
          {/* Filters sit in one row above everything they affect. */}
          <View style={styles.filters}>
            <Select
              compact
              options={[
                { id: 'month', label: 'Por mês' },
                { id: 'year', label: 'Por ano' },
              ]}
              selectedId={grouping}
              onSelect={(id) => setGrouping(id as Grouping)}
            />
            {grouping === 'month' ? (
              <MonthSelect value={monthKey} onChange={setMonthKey} />
            ) : (
              <YearSelect value={year} onChange={setYear} />
            )}
            <AccountSelect value={accountId} onChange={setAccountId} />
          </View>

          {data ? (
            <>
              <View style={styles.tiles}>
                <StatTile
                  label={grouping === 'month' ? 'Gasto no mês' : 'Gasto no ano'}
                  value={<MoneyText cents={data.totalCents} tone="neutral" style={styles.tileValue} />}
                  detail={`${data.count} compra(s) e pagamento(s)`}
                />
                <StatTile
                  label="Estabelecimentos"
                  value={String(data.merchants.length)}
                  detail="onde houve gasto no período"
                />
                <StatTile
                  label="Onde mais gastou"
                  value={top ? top.name : '—'}
                  detail={top ? `${formatCents(top.cents)} · ${Math.round(top.share * 100)}% do total` : undefined}
                />
              </View>

              <Card title="Gastos por estabelecimento">
                <Input placeholder="Procurar estabelecimento..." value={search} onChangeText={setSearch} />
                <MerchantTable merchants={merchants} onOpen={(m) => setOpenId(m.merchantId)} />
              </Card>
            </>
          ) : null}
        </ScrollView>
      </Window>

      <MerchantDetail
        merchantId={openId}
        range={history}
        rangeLabel={grouping === 'year' ? String(year) : `12 meses até ${monthLabel(monthKey)}`}
        onClose={() => setOpenId(null)}
        onEdit={(merchant) => setEditing(merchant)}
      />
      <MerchantForm
        merchant={editing}
        saving={updateMerchant.isPending}
        onClose={() => setEditing(null)}
        onSubmit={handleSave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  filters: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.md },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tileValue: { fontSize: fontSize.xxl - 2, fontWeight: '700' },
});
