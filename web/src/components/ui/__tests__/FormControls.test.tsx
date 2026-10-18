import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Checkbox } from '../Checkbox';
import { DateInput } from '../DateInput';
import { FormError } from '../FormError';
import { CATEGORY_COLORS, ColorPicker } from '../ColorPicker';
import { Input } from '../Input';
import { RadioGroup } from '../RadioGroup';
import { Select } from '../Select';

describe('Input', () => {
  it('shows its label and reports typed text', () => {
    const onChangeText = jest.fn();
    render(<Input label="Nome" placeholder="Ex.: Nubank" onChangeText={onChangeText} />);

    expect(screen.getByText('Nome')).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('Ex.: Nubank'), { target: { value: 'Itaú' } });

    expect(onChangeText).toHaveBeenCalledWith('Itaú');
  });

  it('renders without a label', () => {
    render(<Input placeholder="Buscar" />);

    expect(screen.getByPlaceholderText('Buscar')).toBeTruthy();
  });
});

describe('Checkbox', () => {
  it('reports the new checked state', () => {
    const onChange = jest.fn();
    render(<Checkbox checked={false} onChange={onChange} accessibilityLabel="Selecionar" />);

    fireEvent.click(screen.getByLabelText('Selecionar'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('wraps the box in a clickable label', () => {
    const onChange = jest.fn();
    render(<Checkbox checked onChange={onChange} label="Recorrente" />);

    fireEvent.click(screen.getByText('Recorrente'));

    expect(onChange).toHaveBeenCalledWith(false);
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });
});

describe('Select', () => {
  const options = [
    { id: 'a', label: 'Nubank' },
    { id: 'b', label: 'Itaú' },
  ];

  it('shows the selected option and reports a new choice', () => {
    const onSelect = jest.fn();
    render(<Select label="Conta" options={options} selectedId="a" onSelect={onSelect} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(screen.getByText('Conta')).toBeTruthy();
    expect(select.value).toBe('a');

    fireEvent.change(select, { target: { value: 'b' } });

    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('renders compact without a label or a selection', () => {
    render(<Select compact options={options} selectedId={null} onSelect={jest.fn()} />);

    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('combobox').style.maxWidth).toBe('150px');
  });

  it('shows a disabled placeholder while nothing valid is selected', () => {
    const { rerender } = render(
      <Select options={options} selectedId={null} placeholder="(escolha)" onSelect={jest.fn()} />
    );

    const placeholder = screen.getByRole('option', { name: '(escolha)' }) as HTMLOptionElement;
    expect(placeholder.disabled).toBe(true);
    expect(placeholder.value).toBe('');
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('');

    rerender(<Select options={options} selectedId="sumiu" placeholder="(escolha)" onSelect={jest.fn()} />);
    expect(screen.getByRole('option', { name: '(escolha)' })).toBeTruthy();

    rerender(<Select options={options} selectedId="b" placeholder="(escolha)" onSelect={jest.fn()} />);
    expect(screen.queryByRole('option', { name: '(escolha)' })).toBeNull();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });
});

describe('RadioGroup', () => {
  const options = [
    { value: 'EXPENSE' as const, label: 'Despesa' },
    { value: 'INCOME' as const, label: 'Receita' },
  ];

  it('marks the current option and reports a new choice', () => {
    const onChange = jest.fn();
    render(<RadioGroup options={options} value="EXPENSE" onChange={onChange} />);

    const [expense, income] = screen.getAllByRole('radio');
    const dotOf = (radio: HTMLElement) => (radio.firstChild as HTMLElement).childElementCount;
    expect(dotOf(expense)).toBe(1);
    expect(dotOf(income)).toBe(0);
    expect(expense.getAttribute('aria-checked')).toBe('true');
    expect(income.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(screen.getByText('Receita'));

    expect(onChange).toHaveBeenCalledWith('INCOME');
  });
});

describe('ColorPicker', () => {
  it('offers the category palette by default and reports the picked color', () => {
    const onChange = jest.fn();
    render(<ColorPicker label="Cor" value={CATEGORY_COLORS[0]} onChange={onChange} />);

    expect(screen.getByText('Cor')).toBeTruthy();
    fireEvent.click(screen.getByLabelText(`Cor ${CATEGORY_COLORS[3]}`));

    expect(onChange).toHaveBeenCalledWith(CATEGORY_COLORS[3]);
  });

  it('accepts custom options without a label', () => {
    render(<ColorPicker value="#000000" options={['#000000', '#FFFFFF']} onChange={jest.fn()} />);

    expect(screen.getByLabelText('Cor #000000')).toBeTruthy();
    expect(screen.getByLabelText('Cor #FFFFFF')).toBeTruthy();
    expect(screen.queryByLabelText(`Cor ${CATEGORY_COLORS[0]}`)).toBeNull();
  });
});

describe('DateInput', () => {
  it('shows a labelled native date picker and reports the chosen day', () => {
    const onChange = jest.fn();
    render(<DateInput label="Data:" value="2026-10-18" onChange={onChange} />);

    const input = screen.getByLabelText('Data:') as HTMLInputElement;
    expect(screen.getByText('Data:')).toBeTruthy();
    expect(input.type).toBe('date');
    expect(input.value).toBe('2026-10-18');

    fireEvent.change(input, { target: { value: '2026-10-01' } });

    expect(onChange).toHaveBeenCalledWith('2026-10-01');
  });
});

describe('FormError', () => {
  it('renders nothing without a message', () => {
    const { container } = render(<FormError message={null} />);

    expect(container.innerHTML).toBe('');
  });

  it('announces the message as an alert', () => {
    render(<FormError message="Informe a data." />);

    expect(screen.getByRole('alert').textContent).toBe('Informe a data.');
    expect(screen.getByTestId('icon-exclamation-circle')).toBeTruthy();
  });
});
