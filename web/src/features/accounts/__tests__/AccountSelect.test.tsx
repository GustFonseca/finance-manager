import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { AccountSelect, ALL_ACCOUNTS } from '../components/AccountSelect';
import { accountsApi } from '../api';

jest.mock('../api');

describe('AccountSelect', () => {
  it('offers every account plus the "all accounts" option', async () => {
    jest.mocked(accountsApi.getAll).mockResolvedValue([
      { id: 'a1', name: 'Nubank', balanceCents: 0, createdAt: '' },
      { id: 'a2', name: 'Inter', balanceCents: 0, createdAt: '' },
    ]);
    const onChange = jest.fn();
    renderWithProviders(<AccountSelect value={ALL_ACCOUNTS} onChange={onChange} />);

    await waitFor(() => expect(screen.getByText('Inter')).toBeTruthy());
    expect(screen.getByText('Conta:')).toBeTruthy();
    expect(screen.getByText('Todas as contas')).toBeTruthy();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'a2' } });
    expect(onChange).toHaveBeenCalledWith('a2');
  });
});
