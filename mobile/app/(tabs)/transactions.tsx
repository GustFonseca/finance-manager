import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { transactionsApi, TransactionDto } from '../../services/api';
import { MoneyDisplay } from '../../components/MoneyDisplay';
import { TransactionForm } from '../../components/TransactionForm';
import { colors } from '@/constants/theme';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await transactionsApi.getAll();
      setTransactions(res.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function handleCreate(data: {
    accountId: string;
    categoryId: string;
    type: 'INCOME' | 'EXPENSE';
    amountCents: number;
    description: string;
    date: string;
  }) {
    try {
      await transactionsApi.create(data);
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a transação');
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Confirmar', 'Deseja remover esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await transactionsApi.delete(id);
            loadData();
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível remover a transação');
          }
        },
      },
    ]);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function renderItem({ item }: { item: TransactionDto }) {
    return (
      <View style={styles.item}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemDesc}>{item.description || item.categoryName}</Text>
          <Text style={styles.itemMeta}>
            {new Date(item.date).toLocaleDateString('pt-BR')} · {item.categoryName} · {item.accountName}
          </Text>
        </View>
        <MoneyDisplay
          amountCents={item.type === 'EXPENSE' ? -item.amountCents : item.amountCents}
          style={item.type === 'EXPENSE' ? styles.expense : styles.income}
        />
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma transação encontrada</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <TransactionForm visible={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
  },
  itemLeft: { flex: 1, marginRight: 12 },
  itemDesc: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  itemMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  income: { fontSize: 16, fontWeight: '600', color: colors.income },
  expense: { fontSize: 16, fontWeight: '600', color: colors.expense },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40, fontStyle: 'italic' },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
  deleteBtn: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 6,
    backgroundColor: colors.expense + '20',
  },
  deleteText: { fontSize: 14, color: colors.expense, fontWeight: '700' },
});
