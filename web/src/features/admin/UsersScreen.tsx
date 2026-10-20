import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ErrorState, Input, ListItem, StatTile } from '@/components/ui';
import { Window } from '@/components/xp';
import { formatDateTime } from '@/lib/periods';
import { normalizeText } from '@/lib/text';
import { colors, fontSize, spacing } from '@/theme';
import { useUsersOverview } from './queries';
import { UserOverviewDto } from './types';

const whenOf = (iso: string | null) => (iso ? formatDateTime(iso) : 'nunca');

type RowProps = { user: UserOverviewDto; selected: boolean; onSelect: (id: string) => void };

function UserRow({ user, selected, onSelect }: RowProps) {
  return (
    <ListItem onPress={() => onSelect(user.id)} selected={selected} style={styles.item}>
      <View style={styles.info}>
        <View style={styles.head}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          {user.activeLast7Days ? <Text style={styles.badge}>ativo</Text> : null}
        </View>
        <Text style={styles.email} numberOfLines={1}>
          {user.email}
        </Text>
        <Text style={styles.detail}>Cadastro em {formatDateTime(user.createdAt)}</Text>
      </View>
      <View style={styles.numbers}>
        <Text style={styles.detail}>Último login: {whenOf(user.lastLoginAt)}</Text>
        <Text style={styles.detail}>Último acesso: {whenOf(user.lastSeenAt)}</Text>
        <Text style={styles.detail}>
          {user.loginCount} login(s) · {user.transactionCount} transação(ões)
        </Text>
      </View>
    </ListItem>
  );
}

export function UsersScreen() {
  const { data: users = [], error, isFetching, refetch } = useUsersOverview();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    return term ? users.filter((user) => normalizeText(`${user.name} ${user.email}`).includes(term)) : users;
  }, [users, search]);

  const active = users.filter((user) => user.activeLast7Days).length;
  const logins = users.reduce((total, user) => total + user.loginCount, 0);

  return (
    <Window
      title="Usuários"
      icon="users"
      onRefresh={refetch}
      status={isFetching ? 'Atualizando...' : `${filtered.length} de ${users.length} usuário(s)`}>
      {error ? (
        <ErrorState error={error} fallback="Não foi possível carregar os usuários" onRetry={refetch} />
      ) : (
        <>
          <View style={styles.tiles}>
            <StatTile label="Cadastrados" value={String(users.length)} />
            <StatTile label="Ativos nos últimos 7 dias" value={String(active)} />
            <StatTile label="Logins no total" value={String(logins)} />
          </View>
          <View style={styles.search}>
            <Input
              placeholder="Procurar por nome ou e-mail..."
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Procurar usuários"
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <UserRow user={item} selected={item.id === selectedId} onSelect={setSelectedId} />}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
            ListEmptyComponent={
              <EmptyState message={users.length === 0 ? 'Nenhum usuário cadastrado.' : 'Nenhum usuário encontrado.'} />
            }
          />
        </>
      )}
    </Window>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.sm },
  search: {
    paddingHorizontal: spacing.sm,
    marginBottom: -spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  item: { alignItems: 'flex-start', flexWrap: 'wrap', gap: spacing.sm },
  info: { flex: 1, minWidth: 200, gap: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 },
  badge: { fontSize: fontSize.xs, color: colors.heading, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.xs },
  email: { fontSize: fontSize.sm, color: colors.textSecondary },
  numbers: { gap: 2, minWidth: 220 },
  detail: { fontSize: fontSize.xs, color: colors.textMuted },
});
