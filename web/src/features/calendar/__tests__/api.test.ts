import { http } from '@/lib/http';
import { httpResponse } from '@/test/http';
import { calendarApi } from '../api';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn() } }));

describe('calendarApi', () => {
  it('loads the calendar of the month', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse({ days: [] }));
    await expect(calendarApi.get({ start: 's', end: 'e' })).resolves.toEqual({ days: [] });
    expect(http.get).toHaveBeenCalledWith('/summary/calendar', { params: { start: 's', end: 'e' } });
  });
});
