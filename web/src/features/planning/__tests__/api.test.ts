import { http } from '@/lib/http';
import { httpResponse } from '@/test/http';
import { planningApi } from '../api';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), put: jest.fn() } }));

const mocked = jest.mocked(http);
const range = { start: 's', end: 'e' };

describe('planningApi', () => {
  it('loads the emergency fund, seasonal bills and net worth of the month', async () => {
    mocked.get.mockResolvedValue(httpResponse({ ok: true }));

    await expect(planningApi.emergency(range)).resolves.toEqual({ ok: true });
    await expect(planningApi.seasonal(range)).resolves.toEqual({ ok: true });
    await expect(planningApi.netWorth(range)).resolves.toEqual({ ok: true });
    expect(mocked.get).toHaveBeenCalledWith('/planning/emergency', { params: range });
    expect(mocked.get).toHaveBeenCalledWith('/planning/seasonal', { params: range });
    expect(mocked.get).toHaveBeenCalledWith('/planning/net-worth', { params: range });
  });

  it('saves the emergency fund settings', async () => {
    mocked.put.mockResolvedValue(httpResponse(undefined, 204));

    await expect(planningApi.setEmergency({ months: 6, goalId: null })).resolves.toBeUndefined();
    expect(mocked.put).toHaveBeenCalledWith('/planning/emergency', { months: 6, goalId: null });
  });
});
