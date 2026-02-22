import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GoalDto } from '../services/api';
import { MoneyDisplay } from './MoneyDisplay';

type Props = {
  goal: GoalDto;
  onAddProgress: (goal: GoalDto) => void;
  onComplete: (goal: GoalDto) => void;
};

export function GoalCard({ goal, onAddProgress, onComplete }: Props) {
  const progressWidth = Math.min(goal.progressPercent, 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{goal.name}</Text>
        <Text style={[styles.status, goal.status === 'COMPLETED' && styles.completed]}>
          {goal.status}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progressWidth}%` }]} />
      </View>
      <Text style={styles.progressText}>{goal.progressPercent.toFixed(1)}%</Text>

      <View style={styles.amounts}>
        <MoneyDisplay amountCents={goal.currentCents} style={styles.current} />
        <Text style={styles.separator}> / </Text>
        <MoneyDisplay amountCents={goal.targetCents} style={styles.target} />
      </View>

      {goal.deadline && (
        <Text style={styles.deadline}>
          Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
        </Text>
      )}

      {goal.status === 'ACTIVE' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btn} onPress={() => onAddProgress(goal)}>
            <Text style={styles.btnText}>Adicionar Valor</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnComplete]}
            onPress={() => onComplete(goal)}>
            <Text style={styles.btnText}>Concluir</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '600' },
  status: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  completed: { color: '#4CAF50' },
  progressContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'right' },
  amounts: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  current: { fontSize: 14, fontWeight: '600' },
  separator: { color: '#888' },
  target: { fontSize: 14, color: '#888' },
  deadline: { fontSize: 12, color: '#888', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  btnComplete: { backgroundColor: '#4CAF50' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
