import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { EmptyState, Fab, Screen, useDialog } from '@/components/ui';
import { getErrorMessage } from '@/lib/http';
import { spacing } from '@/theme';
import { AccountForm } from './components/AccountForm';
import { AccountListItem } from './components/AccountListItem';
import { useAccounts, useDeleteAccount, useSaveAccount } from './queries';
import { AccountDto } from './types';

export function AccountsScreen() {
  const { confirm, alert, menu } = useDialog();
  const { data: accounts = [], isFetching, refetch } = useAccounts();
  const saveAccount = useSaveAccount();
  const deleteAccount = useDeleteAccount();

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<AccountDto | null>(null);

  function openCreate() {
    setEditing(null);
    setFormVisible(true);
  }

  function openEdit(account: AccountDto) {
    setEditing(account);
    setFormVisible(true);
  }

  async function handleSubmit(name: string) {
    try {
      await saveAccount.mutateAsync({ id: editing?.id, name });
      setFormVisible(false);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível salvar a conta') });
    }
  }

  async function handleDelete(account: AccountDto) {
    const ok = await confirm({
      title: 'Remover conta',
      message: `Deseja remover "${account.name}"?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteAccount.mutateAsync(account.id);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível remover') });
    }
  }

  function openOptions(account: AccountDto) {
    menu({
      title: account.name,
      actions: [
        { label: 'Editar', onPress: () => openEdit(account) },
        { label: 'Remover', destructive: true, onPress: () => handleDelete(account) },
      ],
    });
  }

  return (
    <Screen>
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <AccountListItem account={item} onPress={openOptions} />}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState message="Nenhuma conta" />}
      />

      <Fab onPress={openCreate} />

      <AccountForm
        visible={formVisible}
        account={editing}
        saving={saveAccount.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
});
