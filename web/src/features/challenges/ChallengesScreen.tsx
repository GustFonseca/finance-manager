import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { EmptyState, ErrorState, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { getErrorMessage } from '@/lib/http';
import { formatCents } from '@/lib/money';
import { spacing } from '@/theme';
import { ChallengeCard } from './components/ChallengeCard';
import { ChallengeForm } from './components/ChallengeForm';
import { useChallenges, useCreateChallenge, useDeleteChallenge } from './queries';
import { ChallengeDto, CreateChallengeInput } from './types';

export function ChallengesScreen() {
  const { confirm, alert } = useDialog();
  const { data: challenges = [], error, isFetching, refetch } = useChallenges();
  const createChallenge = useCreateChallenge();
  const deleteChallenge = useDeleteChallenge();
  const [createVisible, setCreateVisible] = useState(false);

  const saved = challenges.filter((c) => c.status !== 'LOST').reduce((sum, c) => sum + c.savedCents, 0);

  async function handleCreate(data: CreateChallengeInput) {
    try {
      await createChallenge.mutateAsync(data);
      setCreateVisible(false);
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível criar o desafio') });
    }
  }

  async function handleDelete(challenge: ChallengeDto) {
    const ok = await confirm({
      title: 'Remover desafio',
      message: `Deseja remover o desafio "${challenge.name}"?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteChallenge.mutateAsync(challenge.id);
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível remover o desafio') });
    }
  }

  return (
    <>
      <Window
        title="Desafios"
        icon="trophy"
        actions={[{ label: 'Novo desafio', icon: 'plus-circle', onPress: () => setCreateVisible(true) }]}
        onRefresh={refetch}
        status={isFetching ? 'Atualizando...' : `${challenges.length} desafio(s) · ${formatCents(saved)} economizados`}>
        {error ? (
          <ErrorState error={error} fallback="Não foi possível carregar os desafios" onRetry={refetch} />
        ) : (
          <FlatList
            data={challenges}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <ChallengeCard challenge={item} onDelete={handleDelete} />}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
            ListEmptyComponent={
              <EmptyState message="Nenhum desafio ainda. Crie um, como 30 dias sem delivery ou uma semana sem supérfluos." />
            }
          />
        )}
      </Window>

      <ChallengeForm
        visible={createVisible}
        saving={createChallenge.isPending}
        onClose={() => setCreateVisible(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
});
