import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { accountsApi, AccountDto } from '../../services/api';
import { MoneyDisplay } from '../../components/MoneyDisplay';
import { colors } from '@/constants/theme';

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await accountsApi.getAll();
      setAccounts(res.data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  function openCreate() {
    setEditingId(null);
    setName('');
    setShowForm(true);
  }

  function openEdit(account: AccountDto) {
    setEditingId(account.id);
    setName(account.name);
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    try {
      if (editingId) {
        await accountsApi.update(editingId, name);
      } else {
        await accountsApi.create(name);
      }
      setShowForm(false);
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a conta');
    }
  }

  async function handleDelete(account: AccountDto) {
    Alert.alert('Confirmar', `Deseja remover "${account.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await accountsApi.delete(account.id);
            loadData();
          } catch (error: any) {
            const msg = error?.response?.data?.message || 'Não foi possível remover';
            Alert.alert('Erro', msg);
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

  function renderItem({ item }: { item: AccountDto }) {
    return (
      <TouchableOpacity style={styles.item} onPress={() => openEdit(item)} onLongPress={() => handleDelete(item)}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <MoneyDisplay amountCents={item.balanceCents} style={styles.balance} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma conta</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Editar Conta' : 'Nova Conta'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                <Text style={styles.submitText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '500', color: colors.textPrimary },
  balance: { fontSize: 14, marginTop: 4 },
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
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: colors.surface, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: colors.textPrimary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, color: colors.textPrimary },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { fontWeight: '600', color: colors.textMuted },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' },
  submitText: { fontWeight: '600', color: '#fff' },
});
