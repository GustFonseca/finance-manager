import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { EmptyState, Fab, Screen, useDialog } from '@/components/ui';
import { getErrorMessage } from '@/lib/http';
import { spacing } from '@/theme';
import { TransactionForm } from './components/TransactionForm';
import { TransactionListItem } from './components/TransactionListItem';
import { useCreateTransaction, useDeleteTransaction, useTransactions } from './queries';
import { CreateTransactionRequest, TransactionDto } from './types';

export function TransactionsScreen() {
  const { confirm, alert, menu } = useDialog();
  const { data: transactions = [], isFetching, refetch } = useTransactions();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [formVisible, setFormVisible] = useState(false);

  async function handleCreate(data: CreateTransactionRequest) {
    try {
      await createTransaction.mutateAsync(data);
      setFormVisible(false);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível criar a transação') });
    }
  }

  async function handleDelete(transaction: TransactionDto) {
    const ok = await confirm({
      title: 'Remover transação',
      message: 'Deseja remover esta transação?',
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteTransaction.mutateAsync(transaction.id);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível remover a transação') });
    }
  }

  function openOptions(transaction: TransactionDto) {
    menu({
      title: transaction.description || transaction.categoryName,
      actions: [
        { label: 'Remover', destructive: true, onPress: () => handleDelete(transaction) },
      ],
    });
  }

  return (
    <Screen>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TransactionListItem transaction={item} onPress={openOptions} />
        )}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState message="Nenhuma transação encontrada" />}
      />

      <Fab onPress={() => setFormVisible(true)} />

      <TransactionForm
        visible={formVisible}
        submitting={createTransaction.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={handleCreate}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
});
