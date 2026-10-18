import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { taxApi } from '../api';
import { useTaxReport } from '../queries';

jest.mock('../api');

describe('useTaxReport', () => {
  it('keeps the report under the summary', async () => {
    jest.mocked(taxApi.report).mockResolvedValue({ year: 2024 } as never);
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useTaxReport(2024), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ year: 2024 }));
    expect(client.getQueryData(['summary', 'planning', 'tax', 2024])).toEqual({ year: 2024 });
  });
});
