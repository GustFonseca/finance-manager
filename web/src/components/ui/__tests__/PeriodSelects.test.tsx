import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MonthSelect } from '../MonthSelect';
import { YearSelect } from '../YearSelect';

beforeEach(() => jest.useFakeTimers().setSystemTime(new Date(2026, 9, 18)));
afterEach(() => jest.useRealTimers());

function optionLabels() {
  return screen.getAllByRole('option').map((option) => option.textContent);
}

describe('MonthSelect', () => {
  it('offers the last twelve months, newest first', () => {
    render(<MonthSelect value="2026-10" onChange={jest.fn()} />);

    expect(screen.getByText('Mês:')).toBeTruthy();
    const labels = optionLabels();
    expect(labels).toHaveLength(12);
    expect(labels[0]).toBe('outubro de 2026');
    expect(labels[11]).toBe('novembro de 2025');
  });

  it('reports the chosen month key', () => {
    const onChange = jest.fn();
    render(<MonthSelect value="2026-10" onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2026-01' } });

    expect(onChange).toHaveBeenCalledWith('2026-01');
  });
});

describe('YearSelect', () => {
  it('offers the last five years and reports the chosen one as a number', () => {
    const onChange = jest.fn();
    render(<YearSelect value={2026} onChange={onChange} />);

    expect(screen.getByText('Ano:')).toBeTruthy();
    expect(optionLabels()).toEqual(['2026', '2025', '2024', '2023', '2022']);
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('2026');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2024' } });

    expect(onChange).toHaveBeenCalledWith(2024);
  });
});
