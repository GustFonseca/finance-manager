import React, { useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ListItem, Select, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { colors, fontSize, palette, spacing } from '@/theme';
import { useActivity } from './queries';
import { ActivityLogDto, ActivityType } from './types';
import { formatDay } from '@/lib/periods';

const ALL_SOURCES = '';

const TYPES: Record<ActivityType, { label: string; icon: 'info-circle' | 'exclamation-triangle'; color: string }> = {
  INFO: { label: 'Informações', icon: 'info-circle', color: palette.navy },
  WARNING: { label: 'Aviso', icon: 'exclamation-triangle', color: palette.amber },
};

const time = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR');

export function ActivityScreen() {
  const { alert } = useDialog();
  const { data, isFetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useActivity();
  const [source, setSource] = useState(ALL_SOURCES);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const entries = data?.pages.flat() ?? [];
  const sources = [...new Set(entries.map((entry) => entry.source))].sort();
  const visible = source === ALL_SOURCES ? entries : entries.filter((entry) => entry.source === source);

  function press(entry: ActivityLogDto) {
    if (selectedId !== entry.id) {
      setSelectedId(entry.id);
      return;
    }
    alert({
      title: 'Propriedades do evento',
      message:
        `Data: ${formatDay(entry.createdAt)}   Hora: ${time(entry.createdAt)}\n` +
        `Tipo: ${TYPES[entry.type].label}   Origem: ${entry.source}\n\n${entry.description}`,
    });
  }

  return (
    <Window
      title="Visualizar eventos"
      icon="list-alt"
      onRefresh={refetch}
      status={`${visible.length} evento(s)${hasNextPage ? ' · role para carregar mais' : ''}`}>
      <View style={styles.filter}>
        <Text style={styles.filterLabel}>Origem:</Text>
        <Select
          compact
          options={[
            { id: ALL_SOURCES, label: 'Todas' },
            ...sources.map((name) => ({ id: name, label: name })),
          ]}
          selectedId={source}
          onSelect={setSource}
        />
      </View>
      <View style={[styles.row, styles.header]}>
        <Text style={[styles.colType, styles.th]}>Tipo</Text>
        <Text style={[styles.colDate, styles.th]}>Data</Text>
        <Text style={[styles.colTime, styles.th]}>Hora</Text>
        <Text style={[styles.colSource, styles.th]}>Origem</Text>
        <Text style={[styles.colDescription, styles.th]}>Descrição</Text>
      </View>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const type = TYPES[item.type];
          return (
            <ListItem onPress={() => press(item)} selected={selectedId === item.id} style={styles.row}>
              <View style={[styles.colType, styles.typeCell]}>
                <FontAwesome name={type.icon} size={14} color={type.color} />
                <Text style={styles.td}>{type.label}</Text>
              </View>
              <Text style={[styles.colDate, styles.td]}>{formatDay(item.createdAt)}</Text>
              <Text style={[styles.colTime, styles.td]}>{time(item.createdAt)}</Text>
              <Text style={[styles.colSource, styles.td]}>{item.source}</Text>
              <Text style={[styles.colDescription, styles.td]} numberOfLines={1}>
                {item.description}
              </Text>
            </ListItem>
          );
        }}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={isFetching && !isFetchingNextPage} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState message="Nenhum evento registrado ainda." />}
      />
    </Window>
  );
}

const styles = StyleSheet.create({
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  filterLabel: { fontSize: fontSize.sm, color: colors.textPrimary },
  header: { backgroundColor: colors.surfaceLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4, paddingHorizontal: spacing.sm },
  th: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textPrimary },
  td: { fontSize: fontSize.sm, color: colors.textPrimary },
  typeCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  colType: { width: 110 },
  colDate: { width: 80 },
  colTime: { width: 70 },
  colSource: { width: 90 },
  colDescription: { flex: 1, minWidth: 0 },
});
