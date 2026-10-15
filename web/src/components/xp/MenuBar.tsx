import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { bevels, colors, fontSize, PressState, spacing, webStyle } from '@/theme';

export type MenuEntry = { label: string; onPress: () => void } | 'separator';

export type MenuDef = {
  label: string;
  entries: MenuEntry[];
};

/** Window menu bar (Arquivo, Exibir, Ajuda…) with drop-down menus. */
export function MenuBar({ menus }: { menus: MenuDef[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function run(entry: Exclude<MenuEntry, 'separator'>) {
    setOpenIndex(null);
    entry.onPress();
  }

  return (
    <View style={styles.bar}>
      {openIndex !== null ? (
        // Click anywhere else closes the menu, like XP.
        <Pressable style={styles.dismiss} onPress={() => setOpenIndex(null)} />
      ) : null}
      {menus.map((menu, index) => {
        const isOpen = openIndex === index;
        return (
          <View key={menu.label} style={styles.menu}>
            <Pressable
              onPress={() => setOpenIndex(isOpen ? null : index)}
              // While a menu is open, hovering another title switches to it.
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
              <View style={styles.dropdown}>
                {menu.entries.map((entry, i) =>
                  entry === 'separator' ? (
                    <View key={`sep-${i}`} style={styles.separator} />
                  ) : (
                    <MenuItem key={entry.label} label={entry.label} onPress={() => run(entry)} />
                  )
                )}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** One clickable row of a drop-down or context menu. */
export function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={(state) => [styles.item, (state as PressState).hovered && styles.itemHover]}>
      {(state) => (
        <Text style={[styles.itemText, (state as PressState).hovered && styles.itemTextHover]}>
          {label}
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
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
});
