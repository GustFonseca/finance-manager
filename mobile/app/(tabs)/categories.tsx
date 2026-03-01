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
import { categoriesApi, CategoryDto } from '../../services/api';
import { colors } from '@/constants/theme';

const COLORS = ['#F44336', '#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#00BCD4', '#4CAF50', '#8BC34A', '#FF9800', '#FF5722', '#607D8B'];

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [color, setColor] = useState(COLORS[0]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
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
    setType('EXPENSE');
    setColor(COLORS[0]);
    setShowForm(true);
  }

  function openEdit(cat: CategoryDto) {
    setEditingId(cat.id);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color);
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    try {
      if (editingId) {
        await categoriesApi.update(editingId, { name, type, color });
      } else {
        await categoriesApi.create({ name, type, color });
      }
      setShowForm(false);
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a categoria');
    }
  }

  async function handleDelete(cat: CategoryDto) {
    Alert.alert('Confirmar', `Deseja remover "${cat.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await categoriesApi.delete(cat.id);
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

  function showOptions(cat: CategoryDto) {
    Alert.alert(cat.name, '', [
      { text: 'Editar', onPress: () => openEdit(cat) },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => handleDelete(cat),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function renderItem({ item }: { item: CategoryDto }) {
    return (
      <TouchableOpacity style={styles.item} onPress={() => showOptions(item)}>
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemType}>{item.type === 'INCOME' ? 'Receita' : 'Despesa'}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma categoria</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Editar Categoria' : 'Nova Categoria'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'EXPENSE' && styles.expenseActive]}
                onPress={() => setType('EXPENSE')}>
                <Text style={[styles.typeText, type === 'EXPENSE' && styles.typeTextActive]}>
                  Despesa
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'INCOME' && styles.incomeActive]}
                onPress={() => setType('INCOME')}>
                <Text style={[styles.typeText, type === 'INCOME' && styles.typeTextActive]}>
                  Receita
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Cor</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorOption, { backgroundColor: c }, color === c && styles.colorSelected]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>

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
    gap: 12,
  },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '500', color: colors.textPrimary },
  itemType: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
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
  typeToggle: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  expenseActive: { backgroundColor: colors.expense, borderColor: colors.expense },
  incomeActive: { backgroundColor: colors.income, borderColor: colors.income },
  typeText: { fontWeight: '600', color: colors.textPrimary },
  typeTextActive: { color: '#fff' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: colors.textSecondary },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  colorOption: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: colors.textPrimary },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { fontWeight: '600', color: colors.textMuted },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' },
  submitText: { fontWeight: '600', color: '#fff' },
});
