import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, MoneyText } from '@/components/ui';
import { workHoursOf } from '@/lib/workHours';
import { colors, fontSize, spacing, webStyle } from '@/theme';
import { WishDto, WishStatus } from '../types';

type Props = {
  wish: WishDto;
  hourValueCents: number;
  onDecide: (wish: WishDto, status: WishStatus) => void;
  onDelete: (wish: WishDto) => void;
};

const pad = (value: number) => String(value).padStart(2, '0');

export function formatMoment(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function statusText(wish: WishDto): string {
  if (wish.status === 'WAITING') {
    return wish.readyToDecide ? 'A espera acabou: já pode decidir' : `Decida a partir de ${formatMoment(wish.decideAfter)}`;
  }
  const when = wish.decidedAt ? ` em ${formatMoment(wish.decidedAt)}` : '';
  return wish.status === 'BOUGHT' ? `Comprado${when}` : `Desistiu${when}`;
}

function openLink(link: string) {
  window.open(link, '_blank', 'noopener,noreferrer');
}

export function WishRow({ wish, hourValueCents, onDecide, onDelete }: Props) {
  const hours = workHoursOf(wish.priceCents, hourValueCents);

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{wish.name}</Text>
        <Text style={[styles.meta, wish.status === 'WAITING' && wish.readyToDecide && styles.ready]}>{statusText(wish)}</Text>
        {hours ? <Text style={styles.meta}>{hours}</Text> : null}
        {wish.link ? (
          <Text style={styles.link} accessibilityRole="link" onPress={() => openLink(wish.link!)} numberOfLines={1}>
            {wish.link}
          </Text>
        ) : null}
      </View>
      <View style={styles.side}>
        <MoneyText cents={wish.priceCents} tone="neutral" style={styles.price} />
        <View style={styles.actions}>
          {wish.status === 'WAITING' ? (
            <>
              <Button size="sm" label="Desisti" variant="success" onPress={() => onDecide(wish, 'GAVE_UP')} />
              {wish.readyToDecide ? <Button size="sm" label="Comprei" onPress={() => onDecide(wish, 'BOUGHT')} /> : null}
            </>
          ) : (
            <Button size="sm" label="Voltar para a espera" variant="secondary" onPress={() => onDecide(wish, 'WAITING')} />
          )}
          <Button size="sm" label="Remover" variant="danger" onPress={() => onDelete(wish)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  info: { flex: 1, minWidth: 180, gap: 2 },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary },
  ready: { color: colors.income, fontWeight: '700' },
  link: { fontSize: fontSize.xs, color: colors.link, textDecorationLine: 'underline', ...webStyle({ cursor: 'pointer' }) },
  side: { alignItems: 'flex-end', gap: spacing.xs },
  price: { fontSize: fontSize.md, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.xs },
});
