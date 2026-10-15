import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { EmptyState, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { getErrorMessage } from '@/lib/http';
import { spacing } from '@/theme';
import { GoalCard } from './components/GoalCard';
import { GoalForm } from './components/GoalForm';
import { ProgressForm } from './components/ProgressForm';
import {
  useAddGoalProgress,
  useCompleteGoal,
  useCreateGoal,
  useDeleteGoal,
  useGoals,
} from './queries';
import { CreateGoalInput, GoalDto } from './types';

export function GoalsScreen() {
  const { confirm, alert } = useDialog();
  const { data: goals = [], isFetching, refetch } = useGoals();
  const createGoal = useCreateGoal();
  const addProgress = useAddGoalProgress();
  const completeGoal = useCompleteGoal();
  const deleteGoal = useDeleteGoal();

  const [createVisible, setCreateVisible] = useState(false);
  const [progressGoal, setProgressGoal] = useState<GoalDto | null>(null);

  async function handleCreate(data: CreateGoalInput) {
    try {
      await createGoal.mutateAsync(data);
      setCreateVisible(false);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível criar a meta') });
    }
  }

  async function handleAddProgress(amountCents: number) {
    if (!progressGoal) return;
    try {
      await addProgress.mutateAsync({ id: progressGoal.id, amountCents });
      setProgressGoal(null);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível atualizar o progresso') });
    }
  }

  async function handleComplete(goal: GoalDto) {
    const ok = await confirm({
      title: 'Concluir meta',
      message: `Deseja concluir a meta "${goal.name}"?`,
      confirmLabel: 'Concluir',
    });
    if (!ok) return;
    try {
      await completeGoal.mutateAsync(goal.id);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível concluir a meta') });
    }
  }

  async function handleDelete(goal: GoalDto) {
    const ok = await confirm({
      title: 'Remover meta',
      message: `Deseja remover a meta "${goal.name}"?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteGoal.mutateAsync(goal.id);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível remover a meta') });
    }
  }

  return (
    <>
      <Window
        title="Metas"
        icon="bullseye"
        actions={[{ label: 'Nova meta', icon: 'plus-circle', onPress: () => setCreateVisible(true) }]}
        onRefresh={refetch}
        status={`${goals.length} meta(s)`}>
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <GoalCard
              goal={item}
              onAddProgress={setProgressGoal}
              onComplete={handleComplete}
              onDelete={handleDelete}
            />
          )}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState message="Nenhuma meta criada" />}
        />
      </Window>

      <GoalForm
        visible={createVisible}
        saving={createGoal.isPending}
        onClose={() => setCreateVisible(false)}
        onSubmit={handleCreate}
      />

      <ProgressForm
        goal={progressGoal}
        saving={addProgress.isPending}
        onClose={() => setProgressGoal(null)}
        onSubmit={handleAddProgress}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
});
