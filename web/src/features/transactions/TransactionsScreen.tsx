import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { EmptyState, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { ImportWizard } from '@/features/import/ImportWizard';
import { ALL_MERCHANTS, MerchantSelect } from '@/features/merchants/components/MerchantSelect';
import { getErrorMessage } from '@/lib/http';
import { spacing } from '@/theme';
import { TransactionForm } from './components/TransactionForm';
import { TransactionListItem } from './components/TransactionListItem';
import {
  useCreateTransaction,
  useDeleteAllTransactions,
  useDeleteTransaction,
  useTransactions,
} from './queries';
import { CreateTransactionRequest, TransactionDto } from './types';

export function TransactionsScreen() {
  const { confirm, alert, menu } = useDialog();
  const [merchantId, setMerchantId] = useState(ALL_MERCHANTS);
  const { data: transactions = [], isFetching, refetch } = useTransactions(
    merchantId ? { merchantId } : {}
  );
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const deleteAll = useDeleteAllTransactions();

  const [formVisible, setFormVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);

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

  async function handleDeleteAll() {
    const ok = await confirm({
      title: 'Confirmar exclusão de todas as transações',
      message:
        'Tem certeza de que deseja apagar permanentemente todas as suas transações, de todas as contas e estabelecimentos? ' +
        'Os saldos das contas voltam a zero. Contas, categorias e extratos salvos não são apagados.',
      confirmLabel: 'Sim',
      cancelLabel: 'Não',
      destructive: true,
    });
    if (!ok) return;
    try {
      const deleted = await deleteAll.mutateAsync();
      alert({ title: 'Transações apagadas', message: `${deleted} transação(ões) apagada(s).` });
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível apagar as transações') });
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
    <>
      <Window
        title="Transações"
        icon="exchange"
        actions={[
          { label: 'Nova transação', icon: 'plus-circle', onPress: () => setFormVisible(true) },
          { label: 'Importar extrato', icon: 'upload', onPress: () => setImportVisible(true) },
          { label: 'Apagar todas', icon: 'trash', onPress: handleDeleteAll },
        ]}
        onRefresh={refetch}
        status={`${transactions.length} transação(ões)`}>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionListItem transaction={item} onPress={openOptions} />
          )}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          ListHeaderComponent={
            <View style={styles.filters}>
              <MerchantSelect value={merchantId} onChange={setMerchantId} />
            </View>
          }
          ListEmptyComponent={<EmptyState message="Nenhuma transação encontrada" />}
        />
      </Window>

      <TransactionForm
        visible={formVisible}
        submitting={createTransaction.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={handleCreate}
      />

      <ImportWizard visible={importVisible} onClose={() => setImportVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.sm },
});
