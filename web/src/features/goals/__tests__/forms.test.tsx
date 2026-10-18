import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { INVALID_AMOUNT_MESSAGE } from '@/lib/money';
import { dayToIso } from '@/lib/periods';
import { GOAL_NAME_REQUIRED, GoalForm } from '../components/GoalForm';
import { ProgressForm } from '../components/ProgressForm';
import { GoalDto } from '../types';

const goal = { id: 'g1', name: 'Viagem', targetCents: 100000, currentCents: 0 } as GoalDto;

function typeInto(placeholder: string, value: string) {
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
}

function deadlineInput() {
  return screen.getByLabelText('Prazo (opcional):') as HTMLInputElement;
}

describe('GoalForm', () => {
  function renderForm() {
    const onSubmit = jest.fn();
    const utils = render(<GoalForm visible onClose={jest.fn()} onSubmit={onSubmit} />);
    return { onSubmit, ...utils };
  }

  function nameInput() {
    return screen.getByText('Nome da meta:').parentElement!.querySelector('input') as HTMLInputElement;
  }

  it('requires a name', () => {
    const { onSubmit } = renderForm();
    typeInto('ex: 5000,00', '100,00');

    fireEvent.click(screen.getByText('Criar'));

    expect(screen.getByRole('alert').textContent).toBe(GOAL_NAME_REQUIRED);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects invalid, zero and negative targets', () => {
    const { onSubmit } = renderForm();
    fireEvent.change(nameInput(), { target: { value: 'Viagem' } });

    for (const value of ['abc', '0', '-5']) {
      typeInto('ex: 5000,00', value);
      fireEvent.click(screen.getByText('Criar'));
      expect(screen.getByRole('alert').textContent).toBe(INVALID_AMOUNT_MESSAGE);
    }
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sends the goal without a deadline when none is chosen', () => {
    const { onSubmit } = renderForm();
    fireEvent.change(nameInput(), { target: { value: '  Viagem  ' } });
    typeInto('ex: 5000,00', '5000,00');

    fireEvent.click(screen.getByText('Criar'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'Viagem', targetCents: 500000, deadline: undefined });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('sends the chosen deadline as an ISO date', () => {
    const { onSubmit } = renderForm();
    fireEvent.change(nameInput(), { target: { value: 'Carro' } });
    typeInto('ex: 5000,00', '100');
    fireEvent.change(deadlineInput(), { target: { value: '2026-12-20' } });

    fireEvent.click(screen.getByText('Criar'));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Carro', targetCents: 10000, deadline: dayToIso('2026-12-20') });
  });

  it('clears the fields and the error when reopened', () => {
    const { rerender } = renderForm();
    fireEvent.change(nameInput(), { target: { value: 'Carro' } });
    fireEvent.change(deadlineInput(), { target: { value: '2026-12-20' } });
    fireEvent.click(screen.getByText('Criar'));
    expect(screen.getByRole('alert')).toBeTruthy();

    rerender(<GoalForm visible={false} onClose={jest.fn()} onSubmit={jest.fn()} />);
    rerender(<GoalForm visible onClose={jest.fn()} onSubmit={jest.fn()} />);

    expect(nameInput().value).toBe('');
    expect(deadlineInput().value).toBe('');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('ProgressForm', () => {
  it('rejects invalid, zero and negative amounts', () => {
    const onSubmit = jest.fn();
    render(<ProgressForm goal={goal} onClose={jest.fn()} onSubmit={onSubmit} />);

    for (const value of ['x', '0', '-10']) {
      typeInto('ex: 100,00', value);
      fireEvent.click(screen.getByText('Adicionar'));
      expect(screen.getByRole('alert').textContent).toBe(INVALID_AMOUNT_MESSAGE);
    }
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a positive amount and clears the error', () => {
    const onSubmit = jest.fn();
    render(<ProgressForm goal={goal} onClose={jest.fn()} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText('Adicionar'));
    expect(screen.getByRole('alert')).toBeTruthy();

    typeInto('ex: 100,00', '150,50');
    fireEvent.click(screen.getByText('Adicionar'));

    expect(onSubmit).toHaveBeenCalledWith(15050);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('resets when a goal is chosen again', () => {
    const { rerender } = render(<ProgressForm goal={goal} onClose={jest.fn()} onSubmit={jest.fn()} />);
    typeInto('ex: 100,00', 'x');
    fireEvent.click(screen.getByText('Adicionar'));

    rerender(<ProgressForm goal={null} onClose={jest.fn()} onSubmit={jest.fn()} />);
    rerender(<ProgressForm goal={{ ...goal }} onClose={jest.fn()} onSubmit={jest.fn()} />);

    expect((screen.getByPlaceholderText('ex: 100,00') as HTMLInputElement).value).toBe('');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
