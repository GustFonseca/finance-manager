import React, { useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Modal } from '@/components/ui';
import type { HelpTopic } from '@/components/xp';
import { colors, fontSize, spacing } from '@/theme';

type Props = {
  topic: HelpTopic;
  onClose: () => void;
};

export function HelpWizard({ topic, onClose }: Props) {
  const [page, setPage] = useState(0);
  const pages = topic.steps.length + 1;
  const last = page === pages - 1;
  const step = page > 0 ? topic.steps[page - 1] : null;

  return (
    <Modal visible onClose={onClose} icon="question-circle" title={`Como funciona: ${topic.title}`} width={560}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{step ? step.title : 'O que esta janela faz'}</Text>
          <Text style={styles.headerSubtitle}>
            {step ? `Passo ${page} de ${topic.steps.length}` : topic.title}
          </Text>
        </View>
        <FontAwesome name={topic.icon} size={30} color={colors.primary} />
      </View>

      <View style={styles.body}>
        {step ? (
          <Text style={styles.text}>{step.text}</Text>
        ) : (
          <>
            <Text style={styles.text}>{topic.summary}</Text>
            <Text style={styles.section}>Como funciona</Text>
            {topic.howItWorks.map((line) => (
              <View key={line} style={styles.bullet}>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </>
        )}
        {last && topic.tips?.length ? (
          <>
            <Text style={styles.section}>Dicas</Text>
            {topic.tips.map((tip) => (
              <View key={tip} style={styles.bullet}>
                <FontAwesome name="lightbulb-o" size={14} color="#F9A825" style={styles.tipIcon} />
                <Text style={styles.bulletText}>{tip}</Text>
              </View>
            ))}
          </>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.hint}>Você pode rever esta explicação pelo botão "Como funciona" da janela.</Text>
        <View style={styles.buttons}>
          <Button variant="secondary" label="< Voltar" disabled={page === 0} onPress={() => setPage(page - 1)} />
          {last ? (
            <Button label="Concluir" onPress={onClose} />
          ) : (
            <Button label="Avançar >" onPress={() => setPage(page + 1)} />
          )}
        </View>
      </View>
    </Modal>
  );
}

export function presentHelp(topic: HelpTopic, onClose: () => void) {
  return <HelpWizard topic={topic} onClose={onClose} />;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  body: { paddingVertical: spacing.md, gap: spacing.xs, minHeight: 160 },
  text: { fontSize: fontSize.md, color: colors.textPrimary, lineHeight: 20 },
  section: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.md },
  bullet: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dot: { fontSize: fontSize.md, color: colors.primary, lineHeight: 20 },
  tipIcon: { marginTop: 3 },
  bulletText: { flex: 1, fontSize: fontSize.sm, color: colors.textPrimary, lineHeight: 19 },
  footer: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md, gap: spacing.sm },
  hint: { fontSize: fontSize.xs, color: colors.textSecondary },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
