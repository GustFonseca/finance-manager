import { http } from '@/lib/http';
import { rulesApi } from '../api';
import { httpResponse } from '@/test/http';
import { rule } from './fixtures';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));

const input = { type: 'BRAND' as const, pattern: 'ifood', value: 'iFood', priority: 100, note: null };

describe('rulesApi', () => {
  it('lists the rules', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse([rule()]));

    await expect(rulesApi.getAll()).resolves.toEqual([rule()]);
    expect(http.get).toHaveBeenCalledWith('/rules');
  });

  it('creates a rule', async () => {
    jest.mocked(http.post).mockResolvedValue(httpResponse(rule(), 201));

    await expect(rulesApi.create(input)).resolves.toEqual(rule());
    expect(http.post).toHaveBeenCalledWith('/rules', input);
  });

  it('updates a rule', async () => {
    jest.mocked(http.put).mockResolvedValue(httpResponse(rule()));

    await expect(rulesApi.update('r1', input)).resolves.toEqual(rule());
    expect(http.put).toHaveBeenCalledWith('/rules/r1', input);
  });

  it('turns a rule on or off', async () => {
    jest.mocked(http.put).mockResolvedValue(httpResponse(rule({ isActive: false })));

    await expect(rulesApi.setActive('r1', false)).resolves.toEqual(rule({ isActive: false }));
    expect(http.put).toHaveBeenCalledWith('/rules/r1/active', { isActive: false });
  });

  it('tests a pattern against the recent descriptions', async () => {
    const result = { valid: true, error: null, matchCount: 2, checkedCount: 10, samples: ['IFOOD *RESTAURANTE'] };
    jest.mocked(http.post).mockResolvedValue(httpResponse(result));

    await expect(rulesApi.test('ifood')).resolves.toEqual(result);
    expect(http.post).toHaveBeenCalledWith('/rules/test', { pattern: 'ifood' });
  });
});
