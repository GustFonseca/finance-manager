import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ErrorState, Input, Select, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { getErrorMessage } from '@/lib/http';
import { normalizeText } from '@/lib/text';
import { colors, fontSize, spacing } from '@/theme';
import { RuleForm } from './components/RuleForm';
import { RuleListItem } from './components/RuleListItem';
import { useRules, useSaveRule, useSetRuleActive } from './queries';
import { RULE_TYPES, RuleDto, RuleInput, RuleType, TYPE_LABELS } from './types';

const ALL_TYPES = '';

const TYPE_FILTERS = [
  { id: ALL_TYPES, label: 'Todos os tipos' },
  ...RULE_TYPES.map((type) => ({ id: type, label: TYPE_LABELS[type] })),
];

export function RulesScreen() {
  const { alert } = useDialog();
  const { data: rules = [], error, isFetching, refetch } = useRules();
  const saveRule = useSaveRule();
  const setActive = useSetRuleActive();
  const [typeFilter, setTypeFilter] = useState<RuleType | typeof ALL_TYPES>(ALL_TYPES);
  const [search, setSearch] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<RuleDto | null>(null);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    return rules.filter(
      (rule) =>
        (typeFilter === ALL_TYPES || rule.type === typeFilter) &&
        (!term || normalizeText([rule.pattern, rule.value, rule.note].filter(Boolean).join(' ')).includes(term))
    );
  }, [rules, typeFilter, search]);

  function openCreate() {
    setEditing(null);
    setFormVisible(true);
  }

  function openEdit(rule: RuleDto) {
    setEditing(rule);
    setFormVisible(true);
  }

  async function handleSubmit(data: RuleInput) {
    try {
      await saveRule.mutateAsync({ id: editing?.id, data });
      setFormVisible(false);
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível salvar a regra') });
    }
  }

  async function handleToggle(rule: RuleDto, isActive: boolean) {
    try {
      await setActive.mutateAsync({ id: rule.id, isActive });
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível alterar a regra') });
    }
  }

  return (
    <>
      <Window
        title="Regras de classificação"
        icon="sliders"
        actions={[{ label: 'Nova regra', icon: 'plus-circle', onPress: openCreate }]}
        onRefresh={refetch}
        status={isFetching ? 'Atualizando...' : `${filtered.length} de ${rules.length} regra(s)`}>
        {error ? (
          <ErrorState error={error} fallback="Não foi possível carregar as regras" onRetry={refetch} />
        ) : (
          <>
            <View style={styles.filters}>
              <View style={styles.field}>
                <Text style={styles.label}>Tipo:</Text>
                <Select
                  compact
                  options={TYPE_FILTERS}
                  selectedId={typeFilter}
                  onSelect={(id) => setTypeFilter(id as RuleType | typeof ALL_TYPES)}
                />
              </View>
              <View style={styles.search}>
                <Input
                  placeholder="Procurar por padrão, valor ou observação..."
                  value={search}
                  onChangeText={setSearch}
                  accessibilityLabel="Procurar regras"
                />
              </View>
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <RuleListItem rule={item} onEdit={openEdit} onToggle={handleToggle} />}
              refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
              ListEmptyComponent={
                <EmptyState
                  message={rules.length === 0 ? 'Nenhuma regra cadastrada.' : 'Nenhuma regra encontrada com esses filtros.'}
                />
              }
            />
          </>
        )}
      </Window>

      <RuleForm
        visible={formVisible}
        rule={editing}
        saving={saveRule.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { fontSize: fontSize.sm, color: colors.textPrimary },
  search: { flexGrow: 1, minWidth: 220, marginBottom: -spacing.md },
});
