import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { accountsApi, categoriesApi, AccountDto, CategoryDto } from '../services/api';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    accountId: string;
    categoryId: string;
    type: 'INCOME' | 'EXPENSE';
    amountCents: number;
    description: string;
    date: string;
  }) => void;
};

export function TransactionForm({ visible, onClose, onSubmit }: Props) {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, type]);

  async function loadData() {
    try {
      const [accRes, catRes] = await Promise.all([
        accountsApi.getAll(),
        categoriesApi.getAll(type),
      ]);
      setAccounts(accRes.data);
      setCategories(catRes.data);
      if (accRes.data.length > 0 && !selectedAccount) setSelectedAccount(accRes.data[0].id);
      if (catRes.data.length > 0) setSelectedCategory(catRes.data[0].id);
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  }

  function handleSubmit() {
    const amountCents = Math.round(parseFloat(amount.replace(',', '.')) * 100);
    if (isNaN(amountCents) || amountCents <= 0) return;
    if (!selectedAccount || !selectedCategory) return;

    onSubmit({
      accountId: selectedAccount,
      categoryId: selectedCategory,
      type,
      amountCents,
      description,
      date: new Date().toISOString(),
    });

    setAmount('');
    setDescription('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Nova Transação</Text>

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

          <TextInput
            style={styles.input}
            placeholder="Valor (ex: 150,00)"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <TextInput
            style={styles.input}
            placeholder="Descrição"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Conta</Text>
          <ScrollView horizontal style={styles.picker}>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={[styles.chip, selectedAccount === acc.id && styles.chipActive]}
                onPress={() => setSelectedAccount(acc.id)}>
                <Text style={selectedAccount === acc.id ? styles.chipTextActive : undefined}>
                  {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Categoria</Text>
          <ScrollView horizontal style={styles.picker}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.chip,
                  { borderColor: cat.color },
                  selectedCategory === cat.id && { backgroundColor: cat.color },
                ]}
                onPress={() => setSelectedCategory(cat.id)}>
                <Text style={selectedCategory === cat.id ? styles.chipTextActive : undefined}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  typeToggle: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  typeBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  expenseActive: { backgroundColor: '#F44336', borderColor: '#F44336' },
  incomeActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  typeText: { fontWeight: '600' },
  typeTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#555' },
  picker: { marginBottom: 12, maxHeight: 40 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  chipTextActive: { color: '#fff' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { fontWeight: '600', color: '#666' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#2196F3', alignItems: 'center' },
  submitText: { fontWeight: '600', color: '#fff' },
});
