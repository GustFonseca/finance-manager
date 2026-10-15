import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { fontSize } from '@/theme';

function formatTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Notification-area clock (HH:mm), refreshed every few seconds. Starts empty
 * so the statically rendered HTML (built at deploy time) hydrates cleanly.
 */
export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Text style={styles.text} accessibilityLabel={now?.toLocaleString('pt-BR')}>
      {now ? formatTime(now) : ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { color: '#FFFFFF', fontSize: fontSize.xs },
});
