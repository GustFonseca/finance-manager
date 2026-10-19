import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { categoriesApi } from '@/features/categories/api';
import { merchantsApi } from '@/features/merchants/api';
import { MerchantDto } from '@/features/merchants/types';
import { formatCents, INVALID_AMOUNT_MESSAGE } from '@/lib/money';
import { todayStartIso } from '@/lib/periods';
import { renderWithProviders } from '@/test/render';
import { ChallengeCard } from '../components/ChallengeCard';
import {
  CHALLENGE_DAYS_INVALID,
  CHALLENGE_NAME_REQUIRED,
  CHALLENGE_TARGET_REQUIRED,
  ChallengeForm,
  MAX_CHALLENGE_DAYS,
} from '../components/ChallengeForm';
import { challenge } from './fixtures';

jest.mock('@/features/categories/api');
jest.mock('@/features/merchants/api');

const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');
const day = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');
const LIMIT_LABEL = 'Quanto pode gastar no período (vazio = nada):';

const merchant = (id: string, name: string): MerchantDto => ({
  id,
  name,
  kind: 'BUSINESS',
  document: null,
  categoryId: null,
  categoryName: '',
  class: null,
  activity: null,
});

function inputOf(label: string) {
  return screen.getByText(label).parentElement!.querySelector('input')!;
}

function selectOf(label: string) {
  return screen.getByText(label).parentElement!.querySelector('select')!;
}

function alertText() {
  return screen.getByRole('alert').textContent;
}

describe('ChallengeCard', () => {
  it('shows the last day of the challenge, since the end date is exclusive', () => {
    const endsOn = new Date(2026, 10, 9).toISOString();
    renderWithProviders(<ChallengeCard challenge={challenge({ endsOn })} onDelete={jest.fn()} />);
    expect(screen.getByText(/até 08\/11\/2026$/)).toBeTruthy();
  });

  it('shows an active challenge with its limit, progress and estimated savings', () => {
    const onDelete = jest.fn();
    const item = challenge();
    render(<ChallengeCard challenge={item} onDelete={onDelete} />);

    expect(screen.getByText('30 dias sem delivery')).toBeTruthy();
    expect(screen.getByText(`Delivery · 9 de 30 dias · até ${day('2026-11-08T03:00:00Z')}`)).toBeTruthy();
    expect(screen.getByText('Em andamento')).toBeTruthy();
    expect(screen.getByText(`Gasto no desafio (limite de ${money(10000)})`)).toBeTruthy();
    expect(screen.getByText(money(4000))).toBeTruthy();
    expect(screen.getByText('Economia estimada')).toBeTruthy();
    expect(screen.getByText(money(20000))).toBeTruthy();
    expect(
      screen.getByText(`No seu ritmo dos 90 dias anteriores, você teria gasto ${money(24000)} nesses 9 dias.`)
    ).toBeTruthy();

    fireEvent.click(screen.getByText('Remover'));
    expect(onDelete).toHaveBeenCalledWith(item);
  });

  it('shows a won challenge with no spending allowed on its first day', () => {
    render(<ChallengeCard challenge={challenge({ status: 'WON', limitCents: 0, daysElapsed: 1 })} onDelete={jest.fn()} />);

    expect(screen.getByText('Concluído')).toBeTruthy();
    expect(screen.getByText('Gasto no desafio (meta: não gastar nada)')).toBeTruthy();
    expect(
      screen.getByText(`No seu ritmo dos 90 dias anteriores, você teria gasto ${money(24000)} no primeiro dia.`)
    ).toBeTruthy();
  });

  it('shows a lost challenge', () => {
    render(<ChallengeCard challenge={challenge({ status: 'LOST', spentCents: 15000 })} onDelete={jest.fn()} />);

    expect(screen.getByText('Limite estourado')).toBeTruthy();
    expect(screen.getByText(money(15000))).toBeTruthy();
  });
});

describe('ChallengeForm', () => {
  beforeEach(() => {
    jest.mocked(categoriesApi.getAll).mockResolvedValue([{ id: 'c1', name: 'Delivery', type: 'EXPENSE', color: '#a00' }]);
    jest.mocked(merchantsApi.getAll).mockResolvedValue([merchant('m1', 'iFood'), merchant('m2', 'Bar do Zé')]);
  });

  function renderForm() {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    const utils = renderWithProviders(<ChallengeForm visible onClose={onClose} onSubmit={onSubmit} />);
    const setVisible = (visible: boolean) =>
      utils.rerender(<ChallengeForm visible={visible} onClose={onClose} onSubmit={onSubmit} />);
    return { onSubmit, onClose, setVisible };
  }

  it('requires a name and starts a superfluous challenge today with nothing to spend', () => {
    const { onSubmit } = renderForm();

    expect(screen.getByText('Novo desafio')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Gastos supérfluos' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.queryByText('Categoria:')).toBeNull();
    expect(inputOf('Duração em dias:').value).toBe('7');

    fireEvent.change(inputOf('Nome do desafio:'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Começar'));
    expect(alertText()).toBe(CHALLENGE_NAME_REQUIRED);
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(inputOf('Nome do desafio:'), { target: { value: ' Semana sem supérfluos ' } });
    fireEvent.click(screen.getByText('Começar'));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Semana sem supérfluos',
      scope: 'SUPERFLUOUS',
      targetId: null,
      limitCents: 0,
      startsOn: todayStartIso(),
      days: 7,
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('requires a category for a category challenge', async () => {
    const { onSubmit } = renderForm();
    fireEvent.change(inputOf('Nome do desafio:'), { target: { value: 'Sem delivery' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Uma categoria' }));

    await waitFor(() => expect(screen.getByText('Delivery', { selector: 'option' })).toBeTruthy());
    expect(categoriesApi.getAll).toHaveBeenCalledWith('EXPENSE');
    expect(screen.getByText('Escolha...', { selector: 'option' })).toBeTruthy();
    fireEvent.click(screen.getByText('Começar'));
    expect(alertText()).toBe(CHALLENGE_TARGET_REQUIRED);

    fireEvent.change(selectOf('Categoria:'), { target: { value: 'c1' } });
    fireEvent.change(inputOf(LIMIT_LABEL), { target: { value: '0,00' } });
    fireEvent.change(inputOf('Duração em dias:'), { target: { value: ` ${MAX_CHALLENGE_DAYS} ` } });
    fireEvent.click(screen.getByText('Começar'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'CATEGORY', targetId: 'c1', limitCents: 0, days: MAX_CHALLENGE_DAYS })
    );
  });

  it('clears the target when the scope changes and offers the merchants', async () => {
    const { onSubmit } = renderForm();
    fireEvent.change(inputOf('Nome do desafio:'), { target: { value: 'Sem bar' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Uma categoria' }));
    await waitFor(() => expect(screen.getByText('Delivery', { selector: 'option' })).toBeTruthy());
    fireEvent.change(selectOf('Categoria:'), { target: { value: 'c1' } });

    fireEvent.click(screen.getByRole('radio', { name: 'Um estabelecimento' }));
    await waitFor(() => expect(screen.getByText('Bar do Zé', { selector: 'option' })).toBeTruthy());
    expect(screen.queryByText('Delivery', { selector: 'option' })).toBeNull();
    fireEvent.click(screen.getByText('Começar'));
    expect(alertText()).toBe(CHALLENGE_TARGET_REQUIRED);

    fireEvent.change(selectOf('Estabelecimento:'), { target: { value: 'm2' } });
    fireEvent.change(inputOf(LIMIT_LABEL), { target: { value: '100,00' } });
    fireEvent.change(inputOf('Duração em dias:'), { target: { value: '30' } });
    fireEvent.click(screen.getByText('Começar'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Sem bar', scope: 'MERCHANT', targetId: 'm2', limitCents: 10000, days: 30 })
    );
  });

  it('drops the target when going back to superfluous spending', async () => {
    const { onSubmit } = renderForm();
    fireEvent.change(inputOf('Nome do desafio:'), { target: { value: 'Sem bar' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Um estabelecimento' }));
    await waitFor(() => expect(screen.getByText('iFood', { selector: 'option' })).toBeTruthy());
    fireEvent.change(selectOf('Estabelecimento:'), { target: { value: 'm1' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Gastos supérfluos' }));

    fireEvent.click(screen.getByText('Começar'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ scope: 'SUPERFLUOUS', targetId: null }));
  });

  it('rejects an invalid limit and an invalid duration', () => {
    const { onSubmit } = renderForm();
    fireEvent.change(inputOf('Nome do desafio:'), { target: { value: 'Sem delivery' } });

    fireEvent.change(inputOf(LIMIT_LABEL), { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Começar'));
    expect(alertText()).toBe(INVALID_AMOUNT_MESSAGE);

    for (const value of ['-10,00', '1e3', '12.5.0']) {
      fireEvent.change(inputOf(LIMIT_LABEL), { target: { value } });
      fireEvent.click(screen.getByText('Começar'));
      expect(alertText()).toBe(INVALID_AMOUNT_MESSAGE);
    }

    fireEvent.change(inputOf(LIMIT_LABEL), { target: { value: '0' } });
    for (const value of ['', '0', String(MAX_CHALLENGE_DAYS + 1), '1.5', 'abc']) {
      fireEvent.change(inputOf('Duração em dias:'), { target: { value } });
      fireEvent.click(screen.getByText('Começar'));
      expect(alertText()).toBe(CHALLENGE_DAYS_INVALID);
    }
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(inputOf('Duração em dias:'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Começar'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ limitCents: 0, days: 1 }));
  });

  it('resets when reopened and closes on cancel', () => {
    const { onClose, setVisible } = renderForm();
    fireEvent.change(inputOf('Nome do desafio:'), { target: { value: 'Sem bar' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Uma categoria' }));
    fireEvent.change(inputOf('Duração em dias:'), { target: { value: '0' } });
    fireEvent.click(screen.getByText('Começar'));
    expect(screen.getByRole('alert')).toBeTruthy();

    setVisible(false);
    setVisible(true);
    expect(inputOf('Nome do desafio:').value).toBe('');
    expect(inputOf('Duração em dias:').value).toBe('7');
    expect(screen.getByRole('radio', { name: 'Gastos supérfluos' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.queryByRole('alert')).toBeNull();

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();
  });
});
