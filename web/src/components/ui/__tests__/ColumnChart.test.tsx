import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChartColumn, ColumnChart } from '../ColumnChart';
import { hover, unhover } from './pointer';

beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}));

const formatValue = (value: number) => `R$ ${value}`;

function column(key: string, values: number[]): ChartColumn {
  return {
    key,
    label: key,
    segments: values.map((value, i) => ({ key: `${key}-${i}`, value, color: ['red', 'green', 'blue'][i] })),
    details: [`Total ${key}`, `Detalhe ${key}`],
  };
}

describe('ColumnChart', () => {
  it('labels the axis from the tallest column', () => {
    render(<ColumnChart columns={[column('jan', [100, 100]), column('fev', [50])]} formatValue={formatValue} />);

    expect(screen.getByText('R$ 200')).toBeTruthy();
    expect(screen.getByText('R$ 100')).toBeTruthy();
    expect(screen.getByText('R$ 0')).toBeTruthy();
  });

  it('describes each column for screen readers and labels the last one directly', () => {
    render(<ColumnChart columns={[column('jan', [100]), column('fev', [30, 0, 20])]} formatValue={formatValue} height={100} />);

    expect(screen.getByLabelText('jan: Total jan, Detalhe jan')).toBeTruthy();
    const last = screen.getByLabelText('fev: Total fev, Detalhe fev');
    expect(last.textContent).toContain('R$ 50');
    const stack = last.querySelector('div:not([dir])') as HTMLElement;
    expect(stack.children).toHaveLength(2);
    expect((stack.children[0] as HTMLElement).style.height).toBe('30px');
  });

  it('omits the direct label when the last column is empty', () => {
    render(<ColumnChart columns={[column('jan', [100]), column('fev', [0])]} formatValue={formatValue} />);

    expect(screen.getByLabelText('fev: Total fev, Detalhe fev').textContent).toBe('');
  });

  it('shows the column details in a tooltip while hovered', () => {
    const columns = [column('jan', [10]), column('fev', [20]), column('mar', [30])];
    render(<ColumnChart columns={columns} formatValue={formatValue} />);

    expect(screen.queryByText('Detalhe jan')).toBeNull();
    const first = screen.getByLabelText('jan: Total jan, Detalhe jan');
    hover(first);
    expect(screen.getByText('Detalhe jan')).toBeTruthy();
    unhover(first);
    expect(screen.queryByText('Detalhe jan')).toBeNull();

    hover(screen.getByLabelText('mar: Total mar, Detalhe mar'));
    expect(screen.getByText('Total mar')).toBeTruthy();
  });

  it('draws an empty chart with a unit scale', () => {
    render(<ColumnChart columns={[]} formatValue={formatValue} />);

    expect(screen.getByText('R$ 1')).toBeTruthy();
    expect(screen.getByText('R$ 0.5')).toBeTruthy();
  });
});
