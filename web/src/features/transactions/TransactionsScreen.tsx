import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ErrorState, MoneyText, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { filesApi } from '@/features/files/api';
import { ImportWizard } from '@/features/import/ImportWizard';
import { LazyReceiptScanner } from '@/features/receipts/LazyReceiptScanner';
import { getErrorMessage } from '@/lib/http';
import { monthKeyOf, monthLabel, monthRange, yearRange } from '@/lib/periods';
import { colors, fontSize, spacing } from '@/theme';
import { ALL, FilterValues, TransactionFilters } from './components/TransactionFilters';
import { TransactionForm } from './components/TransactionForm';
import { TransactionListItem } from './components/TransactionListItem';
import { buildTransactionsCsv, downloadCsv } from './exportCsv';
import { RECEIPTS_FOLDER } from './receipts';
import {
  useCreateTransaction,
  useDeleteAllTransactions,
  useDeleteTransaction,
  useSetReceipt,
  useTransactions,
  useUpdateTransaction,
} from './queries';
import { CreateTransactionRequest, TransactionDto } from './types';

export const SEARCH_DELAY_MS = 300;

function initialFilters(): FilterValues {
  const now = new Date();
  return {
    grouping: 'month',
    monthKey: monthKeyOf(now),
    year: now.getFullYear(),
    accountId: ALL,
    categoryId: ALL,
    type: ALL,
    merchantId: ALL,
    search: '',
  };
}

export function TransactionsScreen() {
  const { confirm, alert, menu } = useDialog();
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(filters.search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const period = useMemo(
    () => (filters.grouping === 'month' ? monthRange(filters.monthKey) : yearRange(filters.year)),
    [filters.grouping, filters.monthKey, filters.year]
  );
  const { data: transactions = [], error, isFetching, refetch } = useTransactions({
    ...period,
    accountId: filters.accountId || undefined,
    categoryId: filters.categoryId || undefined,
    type: filters.type || undefined,
    merchantId: filters.merchantId || undefined,
    search: search || undefined,
  });
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const deleteAll = useDeleteAllTransactions();
  const setReceipt = useSetReceipt();
  const receiptInput = useRef<HTMLInputElement>(null);
  const receiptTarget = useRef<TransactionDto | null>(null);

  const [editing, setEditing] = useState<TransactionDto | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  const periodName = filters.grouping === 'month' ? monthLabel(filters.monthKey) : String(filters.year);
  const totals = transactions.reduce(
    (sum, t) => ({ ...sum, [t.type]: sum[t.type] + t.amountCents }),
    { INCOME: 0, EXPENSE: 0 }
  );

  function openNew() {
    setEditing(null);
    setFormVisible(true);
  }

  function openEdit(transaction: TransactionDto) {
    setEditing(transaction);
    setFormVisible(true);
  }

  async function handleSave(data: CreateTransactionRequest) {
    try {
      if (editing) await updateTransaction.mutateAsync({ id: editing.id, data });
      else await createTransaction.mutateAsync(data);
      setFormVisible(false);
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível salvar a transação') });
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
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível remover a transação') });
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
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível apagar as transações') });
    }
  }

  function handleExport() {
    if (transactions.length === 0) {
      alert({ title: 'Exportar CSV', message: 'Não há transações no filtro atual para exportar.' });
      return;
    }
    const name = filters.grouping === 'month' ? filters.monthKey : String(filters.year);
    downloadCsv(`transacoes-${name}.csv`, buildTransactionsCsv(transactions));
  }

  async function openReceipt(transaction: TransactionDto) {
    const tab = window.open('', '_blank');
    try {
      const url = await filesApi.downloadUrl(transaction.receiptFileId!);
      if (tab) tab.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      tab?.close();
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível abrir o comprovante') });
    }
  }

  function chooseReceipt(transaction: TransactionDto) {
    receiptTarget.current = transaction;
    receiptInput.current?.click();
  }

  async function attachReceipt(file: File | undefined) {
    const transaction = receiptTarget.current;
    receiptTarget.current = null;
    if (!file || !transaction) return;
    try {
      await setReceipt.mutateAsync({ id: transaction.id, file });
      alert({
        title: 'Comprovante anexado',
        message: `O arquivo "${file.name}" foi salvo na pasta "${RECEIPTS_FOLDER}" e anexado à transação.`,
      });
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível anexar o comprovante') });
    }
  }

  async function removeReceipt(transaction: TransactionDto) {
    const ok = await confirm({
      title: 'Remover comprovante',
      message: `Deseja desanexar o comprovante desta transação? O arquivo continua na pasta "${RECEIPTS_FOLDER}".`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (!ok) return;
    try {
      await setReceipt.mutateAsync({ id: transaction.id, file: null });
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível remover o comprovante') });
    }
  }

  function openOptions(transaction: TransactionDto) {
    const receiptActions = transaction.receiptFileId
      ? [
          { label: 'Ver comprovante', onPress: () => openReceipt(transaction) },
          { label: 'Remover comprovante', onPress: () => removeReceipt(transaction) },
        ]
      : [{ label: 'Anexar comprovante', onPress: () => chooseReceipt(transaction) }];
    menu({
      title: transaction.merchantName || transaction.description || transaction.categoryName,
      actions: [
        { label: 'Editar', onPress: () => openEdit(transaction) },
        ...receiptActions,
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
          { label: 'Nova transação', icon: 'plus-circle', onPress: openNew },
          { label: 'Ler nota', icon: 'camera', onPress: () => setScannerVisible(true) },
          { label: 'Importar extrato', icon: 'upload', onPress: () => setImportVisible(true) },
          { label: 'Exportar CSV', icon: 'download', onPress: handleExport },
          { label: 'Apagar todas', icon: 'trash', onPress: handleDeleteAll },
        ]}
        onRefresh={refetch}
        status={isFetching ? 'Atualizando...' : `${transactions.length} transação(ões) · ${periodName}`}>
        <FlatList
          data={error ? [] : transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionListItem transaction={item} onPress={openOptions} onOpenReceipt={openReceipt} />
          )}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          ListHeaderComponent={
            <>
              <TransactionFilters values={filters} onChange={(change) => setFilters((f) => ({ ...f, ...change }))} />
              <View style={styles.totals}>
                <Text style={styles.total}>Entradas </Text>
                <MoneyText cents={totals.INCOME} tone="income" style={styles.value} />
                <Text style={styles.total}> · Saídas </Text>
                <MoneyText cents={totals.EXPENSE} tone="expense" style={styles.value} />
                <Text style={styles.total}> · Saldo </Text>
                <MoneyText cents={totals.INCOME - totals.EXPENSE} signed style={styles.value} />
              </View>
            </>
          }
          ListEmptyComponent={
            error ? (
              <ErrorState error={error} fallback="Não foi possível carregar as transações" onRetry={refetch} />
            ) : (
              <EmptyState message="Nenhuma transação encontrada com esses filtros" />
            )
          }
        />
      </Window>

      <TransactionForm
        visible={formVisible}
        transaction={editing}
        submitting={createTransaction.isPending || updateTransaction.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSave}
      />

      <ImportWizard visible={importVisible} onClose={() => setImportVisible(false)} />

      <LazyReceiptScanner visible={scannerVisible} onClose={() => setScannerVisible(false)} />

      <input
        ref={receiptInput}
        type="file"
        accept="image/*,application/pdf"
        aria-label="Arquivo do comprovante"
        style={hiddenInput}
        onChange={(event) => {
          attachReceipt(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </>
  );
}

const hiddenInput: React.CSSProperties = { display: 'none' };

const styles = StyleSheet.create({
  totals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceLight,
  },
  total: { fontSize: fontSize.sm, color: colors.textSecondary },
  value: { fontSize: fontSize.sm, fontWeight: '700' },
});
