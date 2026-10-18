import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { apiError } from '@/test/http';
import { rulesApi } from '../api';
import {
  DEFAULT_PRIORITY,
  RULE_PATTERN_REQUIRED,
  RULE_PRIORITY_INVALID,
  RULE_VALUE_REQUIRED,
  RuleForm,
} from '../components/RuleForm';
import { RuleListItem } from '../components/RuleListItem';
import { RULE_TYPES, TYPE_LABELS, TYPES_WITH_VALUE } from '../types';
import { rule } from './fixtures';

jest.mock('../api');

const PATTERN = 'Padrão (expressão regular):';
const REQUIRED_VALUE = 'Valor (obrigatório para este tipo):';
const OPTIONAL_VALUE = 'Valor (opcional):';

function inputOf(label: string) {
  return screen.getByText(label).parentElement!.querySelector('input')!;
}

function typeSelect() {
  return screen.getByText('Tipo:').parentElement!.querySelector('select')!;
}

function alertText() {
  return screen.getByRole('alert').textContent;
}

function renderForm(props: Partial<React.ComponentProps<typeof RuleForm>> = {}) {
  const onSubmit = jest.fn();
  const onClose = jest.fn();
  const utils = renderWithProviders(<RuleForm visible onClose={onClose} onSubmit={onSubmit} {...props} />);
  return { ...utils, onSubmit, onClose };
}

describe('rule types', () => {
  it('labels every type in Portuguese and lists the ones that need a value', () => {
    expect(RULE_TYPES).toHaveLength(14);
    RULE_TYPES.forEach((type) => expect(TYPE_LABELS[type]).toBeTruthy());
    expect([...TYPES_WITH_VALUE].sort()).toEqual(['BRAND', 'CATEGORY_HINT', 'FEE', 'OWN_MONEY', 'SUBSCRIPTION_GROUP']);
  });
});

describe('RuleListItem', () => {
  it('shows the type, pattern, value, note, priority and the default badge', () => {
    const onEdit = jest.fn();
    const onToggle = jest.fn();
    render(<RuleListItem rule={rule()} onEdit={onEdit} onToggle={onToggle} />);

    expect(screen.getByText('Marca')).toBeTruthy();
    expect(screen.getByText('padrão')).toBeTruthy();
    expect(screen.getByText('\\bifood\\b')).toBeTruthy();
    expect(screen.getByText('→ iFood')).toBeTruthy();
    expect(screen.getByText('Delivery de comida')).toBeTruthy();
    expect(screen.getByText('Prioridade 100')).toBeTruthy();
    expect((screen.getByLabelText('Ativa') as HTMLInputElement).checked).toBe(true);

    fireEvent.click(screen.getByLabelText('Ativa'));
    expect(onToggle).toHaveBeenCalledWith(rule(), false);
    expect(onEdit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Editar'));
    expect(onEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Delivery de comida'));
    expect(onEdit).toHaveBeenCalledTimes(2);
    expect(onEdit).toHaveBeenLastCalledWith(rule());
  });

  it('hides what the rule does not have and turns an inactive rule on', () => {
    const onToggle = jest.fn();
    const inactive = rule({ value: null, note: null, isDefault: false, isActive: false, type: 'SUPERFLUOUS' });
    render(<RuleListItem rule={inactive} onEdit={jest.fn()} onToggle={onToggle} />);

    expect(screen.getByText('Supérfluo')).toBeTruthy();
    expect(screen.queryByText('padrão')).toBeNull();
    expect(screen.queryByText(/→/)).toBeNull();
    fireEvent.click(screen.getByLabelText('Ativa'));
    expect(onToggle).toHaveBeenCalledWith(inactive, true);
  });
});

describe('RuleForm', () => {
  it('starts a new rule with the default priority and an optional value', () => {
    renderForm();

    expect(screen.getByText('Nova regra')).toBeTruthy();
    expect(typeSelect().value).toBe('SUPERFLUOUS');
    expect(inputOf('Prioridade:').value).toBe(String(DEFAULT_PRIORITY));
    expect(inputOf(OPTIONAL_VALUE).value).toBe('');
    expect(Array.from(typeSelect().options).map((o) => o.textContent)).toEqual(RULE_TYPES.map((t) => TYPE_LABELS[t]));
  });

  it('requires a pattern', () => {
    const { onSubmit } = renderForm();

    fireEvent.click(screen.getByText('Salvar'));

    expect(alertText()).toBe(RULE_PATTERN_REQUIRED);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires a value for the types that use one', () => {
    const { onSubmit } = renderForm();
    fireEvent.change(typeSelect(), { target: { value: 'BRAND' } });
    fireEvent.change(inputOf(PATTERN), { target: { value: 'ifood' } });

    fireEvent.click(screen.getByText('Salvar'));

    expect(alertText()).toBe(RULE_VALUE_REQUIRED);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires an integer priority', () => {
    const { onSubmit } = renderForm();
    fireEvent.change(inputOf(PATTERN), { target: { value: 'cinema' } });
    fireEvent.change(inputOf('Prioridade:'), { target: { value: '1,5' } });

    fireEvent.click(screen.getByText('Salvar'));

    expect(alertText()).toBe(RULE_PRIORITY_INVALID);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a trimmed rule, sending empty optional fields as null', () => {
    const { onSubmit } = renderForm();
    fireEvent.change(inputOf(PATTERN), { target: { value: '  cinema  ' } });
    fireEvent.change(inputOf('Prioridade:'), { target: { value: ' -5 ' } });
    fireEvent.change(inputOf('Observação:'), { target: { value: '   ' } });

    fireEvent.click(screen.getByText('Salvar'));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(onSubmit).toHaveBeenCalledWith({ type: 'SUPERFLUOUS', pattern: 'cinema', value: null, priority: -5, note: null });
  });

  it('edits an existing rule', () => {
    const { onSubmit } = renderForm({ rule: rule() });

    expect(screen.getByText('Editar regra')).toBeTruthy();
    expect(typeSelect().value).toBe('BRAND');
    expect(inputOf(PATTERN).value).toBe('\\bifood\\b');
    expect(inputOf(REQUIRED_VALUE).value).toBe('iFood');
    expect(inputOf('Observação:').value).toBe('Delivery de comida');
    fireEvent.change(inputOf('Prioridade:'), { target: { value: '200' } });
    fireEvent.change(inputOf(REQUIRED_VALUE), { target: { value: ' iFood Mercado ' } });

    fireEvent.click(screen.getByText('Salvar'));

    expect(onSubmit).toHaveBeenCalledWith({
      type: 'BRAND',
      pattern: '\\bifood\\b',
      value: 'iFood Mercado',
      priority: 200,
      note: 'Delivery de comida',
    });
  });

  it('fills the blanks of a rule without value and note', () => {
    renderForm({ rule: rule({ value: null, note: null, type: 'BILL' }) });

    expect(inputOf(OPTIONAL_VALUE).value).toBe('');
    expect(inputOf('Observação:').value).toBe('');
  });

  it('cancels', () => {
    const { onClose } = renderForm();
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('asks for a pattern before testing it', () => {
    renderForm();

    fireEvent.click(screen.getByText('Testar'));

    expect(alertText()).toBe(RULE_PATTERN_REQUIRED);
    expect(rulesApi.test).not.toHaveBeenCalled();
  });

  it('tests the pattern against the recent descriptions and clears the result when the pattern changes', async () => {
    jest.mocked(rulesApi.test).mockResolvedValue({
      valid: true,
      error: null,
      matchCount: 2,
      checkedCount: 340,
      samples: ['IFOOD *RESTAURANTE', 'IFOOD *MERCADO'],
    });
    renderForm();
    fireEvent.click(screen.getByText('Salvar'));
    fireEvent.change(inputOf(PATTERN), { target: { value: ' ifood ' } });

    fireEvent.click(screen.getByText('Testar'));

    await waitFor(() => expect(screen.getByText('2 de 340 descrições dos últimos 12 meses')).toBeTruthy());
    expect(rulesApi.test).toHaveBeenCalledWith('ifood');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('IFOOD *RESTAURANTE')).toBeTruthy();
    expect(screen.getByText('IFOOD *MERCADO')).toBeTruthy();

    fireEvent.change(inputOf(PATTERN), { target: { value: 'ifood|rappi' } });
    expect(screen.queryByText(/descrições dos últimos 12 meses/)).toBeNull();
  });

  it('shows why the pattern is invalid', async () => {
    jest.mocked(rulesApi.test).mockResolvedValue({
      valid: false,
      error: 'Parêntese sem fechamento',
      matchCount: 0,
      checkedCount: 0,
      samples: [],
    });
    renderForm();
    fireEvent.change(inputOf(PATTERN), { target: { value: '(ifood' } });

    fireEvent.click(screen.getByText('Testar'));

    await waitFor(() => expect(screen.getByText('Padrão inválido: Parêntese sem fechamento')).toBeTruthy());
  });

  it('shows the error when the test request fails', async () => {
    jest.mocked(rulesApi.test).mockRejectedValueOnce(apiError('Acesso negado', 403));
    renderForm();
    fireEvent.change(inputOf(PATTERN), { target: { value: 'ifood' } });

    fireEvent.click(screen.getByText('Testar'));
    await waitFor(() => expect(screen.getByText('Acesso negado')).toBeTruthy());

    jest.mocked(rulesApi.test).mockRejectedValueOnce(new Error('x'));
    fireEvent.click(screen.getByText('Testar'));
    await waitFor(() => expect(screen.getByText('Não foi possível testar o padrão')).toBeTruthy());
  });
});
