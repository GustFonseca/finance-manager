import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Checkbox, DateInput, ErrorState, FormError, Input, Select, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { getErrorMessage } from '@/lib/http';
import { formatDateTime, longMonthOf, todayKey } from '@/lib/periods';
import { colors, fontSize, spacing } from '@/theme';
import { AvatarPicker } from './components/AvatarPicker';
import { BRAZILIAN_STATES, formatPhone, ProfileForm, toForm, validateProfile } from './form';
import { useProfile, useUpdateProfile } from './queries';
import { ProfileDto } from './types';

const STATE_OPTIONS = [
  { id: '', label: 'Não informar' },
  ...BRAZILIAN_STATES.map((state) => ({ id: state.uf, label: `${state.uf} — ${state.name}` })),
];

function accessSummary({ lastSeenAt, loginCount }: ProfileDto): string {
  return lastSeenAt
    ? `Último acesso em ${formatDateTime(lastSeenAt)} · ${loginCount} login(s)`
    : `${loginCount} login(s)`;
}

export function AccountScreen() {
  const { alert } = useDialog();
  const { data: profile, error: loadError, isFetching, refetch, dataUpdatedAt } = useProfile();
  const update = useUpdateProfile();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  if (profile && loadedAt !== dataUpdatedAt) {
    setLoadedAt(dataUpdatedAt);
    setForm(toForm(profile));
  }

  const set = <K extends keyof ProfileForm>(key: K) => (value: ProfileForm[K]) =>
    setForm((prev) => prev && { ...prev, [key]: value });

  async function save(current: ProfileForm) {
    const result = validateProfile(current, todayKey());
    if ('error' in result) {
      setError(result.error);
      scrollRef.current!.scrollTo({ y: 0, animated: true });
      return;
    }
    setError(null);
    try {
      await update.mutateAsync(result.request);
      alert({ title: 'Dados salvos', message: 'Suas informações foram atualizadas.' });
    } catch (saveError) {
      alert({ title: 'Erro', message: getErrorMessage(saveError, 'Não foi possível salvar os seus dados') });
    }
  }

  const status = update.isPending ? 'Salvando...' : isFetching ? 'Carregando...' : (profile?.email ?? '');

  return (
    <Window
      title="Minha conta"
      icon="user-circle"
      actions={form ? [{ label: 'Salvar', icon: 'floppy-o', onPress: () => save(form) }] : []}
      onRefresh={refetch}
      status={status}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        {loadError && !profile ? (
          <ErrorState error={loadError} fallback="Não foi possível carregar os seus dados" onRetry={refetch} />
        ) : profile && form ? (
          <>
            <FormError message={error} />

            <Card title="Ícone">
              <AvatarPicker
                name={form.name}
                icon={form.avatarIcon}
                color={form.avatarColor}
                onIcon={set('avatarIcon')}
                onColor={set('avatarColor')}
              />
            </Card>

            <Card title="Dados pessoais">
              <Input label="Nome" accessibilityLabel="Nome" value={form.name} onChangeText={set('name')} maxLength={100} />
              <Input label="E-mail" accessibilityLabel="E-mail" value={profile.email} editable={false} />
              <Text style={styles.fieldHint}>vem da sua conta Google</Text>
              <View style={styles.row}>
                <View style={styles.cell}>
                  <DateInput label="Data de nascimento" value={form.birthDate} onChange={set('birthDate')} />
                </View>
                <View style={styles.cell}>
                  <Input
                    label="Telefone"
                    accessibilityLabel="Telefone"
                    placeholder="(11) 91234-5678"
                    keyboardType="phone-pad"
                    value={form.phone}
                    onChangeText={(text) => set('phone')(formatPhone(text))}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.cell}>
                  <Input label="Cidade" accessibilityLabel="Cidade" value={form.city} onChangeText={set('city')} maxLength={100} />
                </View>
                <View style={styles.cell}>
                  <Select label="Estado" options={STATE_OPTIONS} selectedId={form.state} onSelect={set('state')} />
                </View>
              </View>
              <Input label="Profissão" accessibilityLabel="Profissão" value={form.occupation} onChangeText={set('occupation')} maxLength={100} />
            </Card>

            <Card title="Informações financeiras">
              <Text style={styles.note}>
                Esses dados vão ajudar nas previsões e no Imposto de Renda. Deixe em branco o que não quiser informar.
              </Text>
              <Input
                label="Renda mensal líquida (R$)"
                    accessibilityLabel="Renda mensal líquida (R$)"
                placeholder="ex: 3.500,00"
                keyboardType="decimal-pad"
                value={form.income}
                onChangeText={set('income')}
              />
              <View style={styles.row}>
                <View style={styles.cell}>
                  <Input
                    label="Dia em que recebe"
                    accessibilityLabel="Dia em que recebe"
                    placeholder="1 a 31"
                    keyboardType="number-pad"
                    value={form.payday}
                    onChangeText={set('payday')}
                  />
                </View>
                <View style={styles.cell}>
                  <Input
                    label="Pessoas que dependem de você"
                    accessibilityLabel="Pessoas que dependem de você"
                    placeholder="0 a 20"
                    keyboardType="number-pad"
                    value={form.dependents}
                    onChangeText={set('dependents')}
                  />
                </View>
              </View>
            </Card>

            <Card title="Preferências">
              <Checkbox
                label="Receber um resumo semanal por e-mail (em breve)"
                checked={form.digestByEmail}
                onChange={set('digestByEmail')}
              />
            </Card>

            <Text style={styles.footer}>Membro desde {longMonthOf(profile.memberSince)}</Text>
            <Text style={styles.footer}>{accessSummary(profile)}</Text>
          </>
        ) : null}
      </ScrollView>
    </Window>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md },
  cell: { flexGrow: 1, flexBasis: 200 },
  fieldHint: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: -spacing.sm, marginBottom: spacing.md },
  note: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.md },
  footer: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
