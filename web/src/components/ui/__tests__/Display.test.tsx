import React from 'react';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { fireEvent, render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { BarTrack } from '../BarTrack';
import { Card } from '../Card';
import { ChartLegend } from '../ChartLegend';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { MoneyText } from '../MoneyText';
import { ProgressBar } from '../ProgressBar';
import { StackedBar } from '../StackedBar';
import { StatTile } from '../StatTile';

jest.mock('react-native-reanimated', () => ({ getUseOfValueInStyleWarning: () => 'aviso do reanimated' }));

beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}));

const normalize = (value: string | null) => (value ?? '').replace(/[  ]/g, ' ');

describe('Card', () => {
  it('renders its children with an optional caption', () => {
    render(
      <Card title="Resumo" testID="card">
        <Text>Conteúdo</Text>
      </Card>
    );

    expect(screen.getByText('Resumo')).toBeTruthy();
    expect(screen.getByText('Conteúdo')).toBeTruthy();
    expect(screen.getByTestId('card')).toBeTruthy();
  });

  it('renders without a caption', () => {
    render(
      <Card>
        <Text>Só conteúdo</Text>
      </Card>
    );

    expect(screen.getByText('Só conteúdo')).toBeTruthy();
  });
});

describe('ChartLegend', () => {
  it('lists every item with its optional value', () => {
    render(
      <ChartLegend
        items={[
          { label: 'Essencial', color: '#00f', value: '50%' },
          { label: 'Supérfluo', color: '#f00' },
        ]}
      />
    );

    expect(screen.getByText('Essencial')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
    expect(screen.getByText('Supérfluo')).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('shows the message', () => {
    render(<EmptyState message="Nenhuma conta cadastrada." />);

    expect(screen.getByText('Nenhuma conta cadastrada.')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('explains the failure and retries on request', () => {
    const onRetry = jest.fn();
    render(<ErrorState error={new Error('x')} fallback="Erro ao carregar contas" onRetry={onRetry} />);

    expect(screen.getByText('Erro ao carregar contas')).toBeTruthy();
    expect(screen.getByTestId('icon-exclamation-triangle')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the message sent by the API', () => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    const error = new AxiosError('x', 'ERR', config, null, {
      status: 400,
      statusText: '',
      data: { message: 'Conta inválida' },
      headers: {},
      config,
    });
    render(<ErrorState error={error} fallback="Erro" onRetry={jest.fn()} />);

    expect(screen.getByText('Conta inválida')).toBeTruthy();
  });
});

describe('MoneyText', () => {
  it('formats the amount in reais', () => {
    render(<MoneyText cents={123456} />);

    expect(normalize(screen.getByText(/1\.234,56/).textContent)).toBe('R$ 1.234,56');
  });

  it('shows a plus sign when signed', () => {
    render(<MoneyText cents={500} signed tone="income" />);

    expect(normalize(screen.getByText(/5,00/).textContent)).toBe('+ R$ 5,00');
  });

  it('colors negative amounts as expenses by default', () => {
    render(
      <>
        <MoneyText cents={-500} />
        <MoneyText cents={-500} tone="neutral" />
        <MoneyText cents={500} tone="expense" />
        <MoneyText cents={500} tone="income" />
      </>
    );

    const [autoNegative, neutral, expense, income] = screen.getAllByText(/5,00/);
    expect(autoNegative.style.color).toBe(expense.style.color);
    expect(neutral.style.color).toBe('');
    expect(income.style.color).not.toBe(expense.style.color);
  });
});

describe('ProgressBar', () => {
  it('clamps the fill between 0% and 100%', () => {
    const { container } = render(
      <>
        <ProgressBar percent={150} />
        <ProgressBar percent={-10} height={8} />
        <ProgressBar percent={40} />
      </>
    );

    const fills = Array.from(container.children).map((track) => (track.firstChild as HTMLElement).style.width);
    expect(fills).toEqual(['100%', '0%', '40%']);
  });
});

describe('BarTrack', () => {
  it('fills the track proportionally, clamped to its size', () => {
    const { container } = render(
      <>
        <BarTrack ratio={0.25} color="#00f" />
        <BarTrack ratio={2} color="#00f" thickness={6} />
        <BarTrack ratio={-1} color="#00f" />
      </>
    );

    const fills = Array.from(container.children).map((track) => (track.firstChild as HTMLElement).style.width);
    expect(fills).toEqual(['25%', '100%', '0%']);
  });
});

describe('StackedBar', () => {
  it('draws one segment per positive value', () => {
    const { container } = render(
      <StackedBar
        segments={[
          { key: 'a', value: 30, color: 'red' },
          { key: 'b', value: 0, color: 'green' },
          { key: 'c', value: 70, color: 'blue' },
        ]}
      />
    );

    const bar = container.firstChild as HTMLElement;
    expect(bar.children).toHaveLength(2);
    expect((bar.children[0] as HTMLElement).style.flexGrow).toBe('30');
    expect((bar.children[1] as HTMLElement).style.flexGrow).toBe('70');
  });

  it('draws an empty track when there is nothing to show', () => {
    const { container } = render(<StackedBar segments={[{ key: 'a', value: 0, color: 'red' }]} thickness={10} />);

    expect((container.firstChild as HTMLElement).children).toHaveLength(0);
  });
});

describe('StatTile', () => {
  it('shows a text value with its detail', () => {
    render(<StatTile label="Saldo" value="R$ 10,00" detail="em 3 contas" />);

    expect(screen.getByText('Saldo')).toBeTruthy();
    expect(screen.getByText('R$ 10,00')).toBeTruthy();
    expect(screen.getByText('em 3 contas')).toBeTruthy();
  });

  it('renders a custom value element as is', () => {
    render(<StatTile label="Gastos" value={<Text testID="custom">custom</Text>} />);

    expect(screen.getByTestId('custom')).toBeTruthy();
  });
});
