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
import { goalsApi, GoalDto } from '../../services/api';
import { GoalCard } from '../../components/GoalCard';
import { colors } from '@/constants/theme';

export default function GoalsScreen() {
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalDto | null>(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [progressAmount, setProgressAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await goalsApi.getAll();
      setGoals(res.data);
    } catch (error) {
      console.error('Failed to load goals:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function handleCreate() {
    const targetCents = Math.round(parseFloat(target.replace(',', '.')) * 100);
    if (!name || isNaN(targetCents) || targetCents <= 0) return;

    try {
      await goalsApi.create({ name, targetCents });
      setName('');
      setTarget('');
      setShowCreate(false);
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a meta');
    }
  }

  async function handleAddProgress() {
    if (!selectedGoal) return;
    const amountCents = Math.round(parseFloat(progressAmount.replace(',', '.')) * 100);
    if (isNaN(amountCents) || amountCents <= 0) return;

    try {
      await goalsApi.updateProgress(selectedGoal.id, amountCents);
      setProgressAmount('');
      setShowProgress(false);
      setSelectedGoal(null);
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o progresso');
    }
  }

  async function handleComplete(goal: GoalDto) {
    Alert.alert('Confirmar', `Deseja concluir a meta "${goal.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Concluir',
        onPress: async () => {
          try {
            await goalsApi.complete(goal.id);
            loadData();
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível concluir a meta');
          }
        },
      },
    ]);
  }

  async function handleDelete(goal: GoalDto) {
    Alert.alert('Confirmar', `Deseja remover a meta "${goal.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await goalsApi.delete(goal.id);
            loadData();
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível remover a meta');
          }
        },
      },
    ]);
  }

  function onAddProgress(goal: GoalDto) {
    setSelectedGoal(goal);
    setShowProgress(true);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={goals}
        renderItem={({ item }) => (
          <GoalCard goal={item} onAddProgress={onAddProgress} onComplete={handleComplete} onDelete={handleDelete} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma meta criada</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create Goal Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nova Meta</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da meta"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Valor alvo (ex: 5000,00)"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={target}
              onChangeText={setTarget}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
                <Text style={styles.submitText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Progress Modal */}
      <Modal visible={showProgress} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              Adicionar Valor — {selectedGoal?.name}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Valor (ex: 100,00)"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={progressAmount}
              onChangeText={setProgressAmount}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowProgress(false);
                  setSelectedGoal(null);
                }}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddProgress}>
                <Text style={styles.submitText}>Adicionar</Text>
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { fontWeight: '600', color: colors.textMuted },
  submitBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitText: { fontWeight: '600', color: '#fff' },
});
