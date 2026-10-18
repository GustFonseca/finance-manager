import React, { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { bevels, colors, fontSize, PressState, spacing, webStyle } from '@/theme';

export type MenuEntry =
  | {
      label: string;
      onPress: () => void;
      bold?: boolean;
      disabled?: boolean;
    }
  | 'separator';

export type MenuDef = {
  label: string;
  entries: MenuEntry[];
};

export function MenuBar({ menus }: { menus: MenuDef[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function run(entry: Exclude<MenuEntry, 'separator'>) {
    setOpenIndex(null);
    entry.onPress();
  }

  return (
    <View style={styles.bar}>
      {openIndex !== null ? (
        <Pressable style={styles.dismiss} onPress={() => setOpenIndex(null)} />
      ) : null}
      {menus.map((menu, index) => {
        const isOpen = openIndex === index;
        return (
          <View key={menu.label} style={styles.menu}>
            <Pressable
              onPress={() => setOpenIndex(isOpen ? null : index)}
              onHoverIn={() => openIndex !== null && setOpenIndex(index)}
              style={(state) => {
                const { hovered } = state as PressState;
                return [styles.title, (isOpen || hovered) && styles.titleActive];
              }}>
              {(state) => (
                <Text
                  style={[
                    styles.titleText,
                    (isOpen || (state as PressState).hovered) && styles.titleTextActive,
                  ]}>
                  {menu.label}
                </Text>
              )}
            </Pressable>
            {isOpen ? (
              <MenuPanel entries={menu.entries} onRun={run} style={styles.dropdown} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

type MenuPanelProps = {
  entries: MenuEntry[];
  onRun: (entry: Exclude<MenuEntry, 'separator'>) => void;
  style?: StyleProp<ViewStyle>;
};

export function MenuPanel({ entries, onRun, style }: MenuPanelProps) {
  return (
    <View style={[styles.panel, style]} accessibilityRole="menu">
      {entries.map((entry, i) =>
        entry === 'separator' ? (
          <View key={`sep-${i}`} style={styles.separator} />
        ) : (
          <MenuItem key={entry.label} entry={entry} onPress={() => onRun(entry)} />
        )
      )}
    </View>
  );
}

type MenuItemProps = {
  entry: Exclude<MenuEntry, 'separator'>;
  onPress: () => void;
};

export function MenuItem({ entry, onPress }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={entry.disabled}
      accessibilityRole="menuitem"
      style={(state) => [
        styles.item,
        !entry.disabled && (state as PressState).hovered && styles.itemHover,
      ]}>
      {(state) => (
        <Text
          style={[
            styles.itemText,
            entry.bold && styles.itemTextBold,
            entry.disabled && styles.itemTextDisabled,
            !entry.disabled && (state as PressState).hovered && styles.itemTextHover,
          ]}>
          {entry.label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D2BD',
    paddingHorizontal: 2,
    zIndex: 20,
  },
  dismiss: webStyle({ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }),
  menu: { position: 'relative' },
  title: { paddingHorizontal: spacing.sm - 2, paddingVertical: 3, ...webStyle({ cursor: 'default' }) },
  titleActive: { backgroundColor: colors.selection },
  titleText: { fontSize: fontSize.sm, color: colors.textPrimary },
  titleTextActive: { color: colors.textOnAccent },
  dropdown: { position: 'absolute', top: '100%', left: 0 },
  panel: {
    minWidth: 180,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#ACA899',
    paddingVertical: 2,
    ...webStyle({ boxShadow: bevels.menu }),
  },
  separator: { height: 1, backgroundColor: '#ACA899', marginVertical: 3, marginHorizontal: 2 },
  item: { paddingVertical: 3, paddingLeft: 20, paddingRight: spacing.lg, ...webStyle({ cursor: 'default' }) },
  itemHover: { backgroundColor: colors.selection },
  itemText: { fontSize: fontSize.sm, color: colors.textPrimary },
  itemTextHover: { color: colors.textOnAccent },
  itemTextBold: { fontWeight: '700' },
  itemTextDisabled: { color: '#ACA899' },
});
