import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useWindowManager } from '@/components/xp';
import { formatCents } from '@/lib/money';
import { renderWithProviders } from '@/test/render';
import { avoidableApi } from '../api';
import { AvoidableRow } from '../components/AvoidableRow';
import { AvoidableSummaryCard } from '../components/AvoidableSummaryCard';
import { fullReport } from './fixtures';

jest.mock('../api');

const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');

describe('AvoidableRow', () => {
  it('shows the title, detail, value, highlight and actions', () => {
    const onPress = jest.fn();
    render(
      <AvoidableRow
        title="Netflix"
        detail="Streaming"
        value="R$ 10,00"
        highlight="Preço subiu"
        actions={[{ label: 'Ver detalhes', onPress }]}
      />
    );

    expect(screen.getByText('Netflix')).toBeTruthy();
    expect(screen.getByText('Streaming')).toBeTruthy();
    expect(screen.getByText('R$ 10,00')).toBeTruthy();
    expect(screen.getByText('Preço subiu')).toBeTruthy();
    fireEvent.click(screen.getByText('Ver detalhes'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('hides the highlight and the actions when there are none', () => {
    render(<AvoidableRow title="Padaria" detail="Pequenos gastos" value="R$ 5,00" highlight="" />);

    expect(screen.getByText('Padaria')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('Preço subiu')).toBeNull();
  });
});

describe('AvoidableSummaryCard', () => {
  const filter = { start: 's', end: 'e', accountId: 'a1' };

  it('renders nothing until the data arrives', () => {
    jest.mocked(avoidableApi.get).mockReturnValue(new Promise(() => {}));
    const { container } = renderWithProviders(<AvoidableSummaryCard filter={filter} />);

    expect(container.innerHTML).toBe('');
    expect(avoidableApi.get).toHaveBeenCalledWith(filter);
  });

  it('shows the avoidable spending of the month and opens the avoidable window', async () => {
    jest.mocked(avoidableApi.get).mockResolvedValue(fullReport);
    let wm: ReturnType<typeof useWindowManager> | undefined;
    function Probe() {
      wm = useWindowManager();
      return null;
    }
    renderWithProviders(
      <>
        <Probe />
        <AvoidableSummaryCard filter={filter} />
      </>
    );

    expect(await screen.findByText('Gastos evitáveis')).toBeTruthy();
    expect(screen.getByText(money(45000))).toBeTruthy();
    expect(
      screen.getByText(`em gastos supérfluos neste mês · ${money(480000)} em 12 meses no ritmo atual`)
    ).toBeTruthy();
    expect(wm!.openWindows).not.toContain('/avoidable');

    act(() => {
      fireEvent.click(screen.getByText('Ver gastos evitáveis'));
    });

    await waitFor(() => expect(wm!.activeWindow).toBe('/avoidable'));
    expect(wm!.openWindows).toContain('/avoidable');
  });
});
