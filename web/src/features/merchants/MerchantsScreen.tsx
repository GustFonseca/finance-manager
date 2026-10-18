import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, ErrorState, Input, MoneyText, MonthSelect, Select, StatTile, YearSelect, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { ALL_ACCOUNTS, AccountSelect } from '@/features/accounts/components/AccountSelect';
import { useAccounts } from '@/features/accounts/queries';
import { monthKeyOf, monthLabel, monthRange, twelveMonthsUntil, yearRange } from '@/lib/periods';
import { normalizeText } from '@/lib/text';
import { getErrorMessage } from '@/lib/http';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { MerchantDetail } from './components/MerchantDetail';
import { MerchantForm } from './components/MerchantForm';
import { MerchantTable } from './components/MerchantTable';
import { OrganizeMerchants } from './components/OrganizeMerchants';
import { useMerchantSpending, useUnsortedMerchants, useUpdateMerchant } from './queries';
import { MerchantDto, UpdateMerchantInput } from './types';

type Grouping = 'month' | 'year';

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
  const [organizing, setOrganizing] = useState(false);
  const lastYear = useMemo(() => twelveMonthsUntil(monthKeyOf(new Date())), []);
  const { data: unsorted = [] } = useUnsortedMerchants(lastYear);

  const period = useMemo(
    () => (grouping === 'month' ? monthRange(monthKey) : yearRange(year)),
    [grouping, monthKey, year]
  );
  const history = useMemo(
    () => (grouping === 'year' ? yearRange(year) : twelveMonthsUntil(monthKey)),
    [grouping, monthKey, year]
  );

  const { data, error, isFetching, refetch } = useMerchantSpending({ ...period, accountId: accountId || undefined });
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
        actions={[{ label: 'Organizar gastos', icon: 'tags', onPress: () => setOrganizing(true) }]}
        onRefresh={refetch}
        status={
          isFetching
            ? 'Atualizando...'
            : `${data?.merchants.length ?? 0} estabelecimento(s) · ${periodName} · ${accountName}`
        }>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
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

          {unsorted.length > 0 ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                {unsorted.length} estabelecimento(s) sem categoria nos últimos 12 meses. Organize para a análise e o
                plano ficarem mais precisos.
              </Text>
              <Button size="sm" label="Organizar agora" onPress={() => setOrganizing(true)} />
            </View>
          ) : null}

          {error ? (
            <ErrorState error={error} fallback="Não foi possível carregar os estabelecimentos" onRetry={refetch} />
          ) : data ? (
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
      <OrganizeMerchants visible={organizing} onClose={() => setOrganizing(false)} />
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
  banner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    backgroundColor: '#FFFFE1',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerText: { flex: 1, minWidth: 200, fontSize: fontSize.sm, color: colors.textPrimary },
});
