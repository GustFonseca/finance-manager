import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { ListItem } from '@/components/ui';
import type { IconName } from '@/components/xp';
import { colors, fontSize } from '@/theme';
import type { Point } from '@/components/xp/useWindowDrag';

type Props = {
  icon: IconName;
  iconColor: string;
  name: string;
  /** Second line, e.g. "Local original: Documentos". */
  detail?: string;
  /** Right-aligned columns, e.g. size and date. */
  columns: string[];
  selected: boolean;
  onPress: () => void;
  onRightClick: (point: Point) => void;
};

/** One row of an Explorer "details" list (folder contents, Lixeira). */
export function FileListItem({ icon, iconColor, name, detail, columns, selected, onPress, onRightClick }: Props) {
  return (
    <ListItem onPress={onPress} onRightClick={onRightClick} selected={selected}>
      <FontAwesome name={icon} size={18} color={iconColor} style={styles.icon} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {columns.map((column, i) => (
        <Text key={i} style={styles.column} numberOfLines={1}>
          {column}
        </Text>
      ))}
    </ListItem>
  );
}

const styles = StyleSheet.create({
  icon: { width: 20, textAlign: 'center' },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: fontSize.md, color: colors.textPrimary },
  detail: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  column: { width: 110, fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'right' },
});
