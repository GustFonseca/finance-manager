import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, ErrorState, MoneyText, StatTile, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { getErrorMessage } from '@/lib/http';
import { workHoursOf } from '@/lib/workHours';
import { colors, fontSize, spacing } from '@/theme';
import { WishForm } from './components/WishForm';
import { WishRow } from './components/WishRow';
import { useCreateWish, useDecideWish, useDeleteWish, useWishlist } from './queries';
import { CreateWishInput, WishDto, WishStatus } from './types';

const GROUPS: { status: WishStatus; title: string }[] = [
  { status: 'WAITING', title: 'Em espera' },
  { status: 'GAVE_UP', title: 'Desisti de comprar' },
  { status: 'BOUGHT', title: 'Comprados' },
];

const DECISION_ERRORS: Record<WishStatus, string> = {
  WAITING: 'Não foi possível voltar o desejo para a espera',
  GAVE_UP: 'Não foi possível registrar a desistência',
  BOUGHT: 'Não foi possível registrar a compra',
};

export function WishlistScreen() {
  const { confirm, alert } = useDialog();
  const { data, error, isFetching, refetch } = useWishlist();
  const createWish = useCreateWish();
  const decideWish = useDecideWish();
  const deleteWish = useDeleteWish();
  const [createVisible, setCreateVisible] = useState(false);

  const items = data?.items ?? [];
  const hourValueCents = data?.hourValueCents ?? 0;

  async function handleCreate(input: CreateWishInput) {
    try {
      await createWish.mutateAsync(input);
      setCreateVisible(false);
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível adicionar o desejo') });
    }
  }

  async function handleDecide(wish: WishDto, status: WishStatus) {
    try {
      await decideWish.mutateAsync({ id: wish.id, status });
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, DECISION_ERRORS[status]) });
    }
  }

  async function handleDelete(wish: WishDto) {
    const ok = await confirm({
      title: 'Remover desejo',
      message: `Deseja remover "${wish.name}" da lista de espera?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteWish.mutateAsync(wish.id);
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível remover o desejo') });
    }
  }

  return (
    <>
      <Window
        title="Lista de espera"
        icon="hourglass-half"
        actions={[{ label: 'Novo desejo', icon: 'plus-circle', onPress: () => setCreateVisible(true) }]}
        onRefresh={refetch}
        status={isFetching ? 'Atualizando...' : `${items.length} desejo(s)`}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
          {error ? (
            <ErrorState error={error} fallback="Não foi possível carregar a lista de espera" onRetry={refetch} />
          ) : data ? (
            <>
              <View style={styles.tiles}>
                <StatTile
                  label="Economizado ao desistir"
                  value={<MoneyText cents={data.savedCents} tone="income" style={styles.tileValue} />}
                  detail={workHoursOf(data.savedCents, hourValueCents) ?? 'desista de um desejo para começar'}
                />
                <StatTile
                  label="Em espera"
                  value={<MoneyText cents={data.waitingCents} tone="neutral" style={styles.tileValue} />}
                  detail={workHoursOf(data.waitingCents, hourValueCents) ?? 'nenhum desejo esperando'}
                />
              </View>
              <Text style={styles.lead}>
                Antes de comprar por impulso, coloque o desejo aqui e espere {data.waitHours} h. Se a vontade passar, o
                dinheiro fica com você.
              </Text>
              {items.length === 0 ? <EmptyState message="Nenhum desejo na lista. Use Novo desejo para adicionar." /> : null}
              {GROUPS.map(({ status, title }) => {
                const group = items.filter((item) => item.status === status);
                if (group.length === 0) return null;
                return (
                  <Card key={status} title={title}>
                    {group.map((wish) => (
                      <WishRow
                        key={wish.id}
                        wish={wish}
                        hourValueCents={hourValueCents}
                        onDecide={handleDecide}
                        onDelete={handleDelete}
                      />
                    ))}
                  </Card>
                );
              })}
            </>
          ) : null}
        </ScrollView>
      </Window>

      <WishForm
        visible={createVisible}
        waitHours={data?.waitHours ?? 0}
        saving={createWish.isPending}
        onClose={() => setCreateVisible(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tileValue: { fontSize: fontSize.xxl - 2, fontWeight: '700' },
  lead: { fontSize: fontSize.sm, color: colors.textSecondary },
});
