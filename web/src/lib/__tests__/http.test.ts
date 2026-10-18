import { buildUrl, getErrorMessage, http, HttpError, isHttpError, REQUEST_TIMEOUT_MS, setUnauthorizedHandler, TOKEN_KEY } from '../http';
import { isServerWaking, SLOW_REQUEST_MS } from '../serverWake';

type FakeInit = { status?: number; body?: string; headers?: Record<string, string> };

function fakeResponse({ status = 200, body = '', headers = {} }: FakeInit = {}) {
  const entries = Object.entries(headers);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => entries.find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] ?? null,
      forEach: (callback: (value: string, key: string) => void) => entries.forEach(([key, value]) => callback(value, key)),
    },
    text: async () => body,
  };
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return fakeResponse({ status, body: JSON.stringify(data), headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}

const fetchMock = jest.fn();

function lastCall(): [string, RequestInit & { headers: Record<string, string> }] {
  return fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
}

function httpError(status: number, data?: unknown, headers: Record<string, string> = {}) {
  return new HttpError('falhou', { status, data, headers });
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(json('ok'));
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
});

afterEach(() => {
  setUnauthorizedHandler(null);
  delete (globalThis as { fetch?: unknown }).fetch;
});

describe('buildUrl', () => {
  it('points to the local API by default', () => {
    expect(buildUrl('/accounts')).toBe('http://localhost:5101/api/accounts');
  });

  it('appends params and drops empty ones', () => {
    expect(buildUrl('/t', { from: '2026-01-01', limit: 5, flag: false, missing: undefined, none: null })).toBe(
      'http://localhost:5101/api/t?from=2026-01-01&limit=5&flag=false'
    );
  });

  it('adds no query string when every param is empty', () => {
    expect(buildUrl('/t', { a: undefined, b: null })).toBe('http://localhost:5101/api/t');
  });

  it('uses the configured API url when present', () => {
    const previous = process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_API_URL = 'https://api.exemplo.com';
    jest.isolateModules(() => {
      expect(require('../http').buildUrl('/a')).toBe('https://api.exemplo.com/a');
    });
    process.env.EXPO_PUBLIC_API_URL = previous;
  });
});

describe('http client', () => {
  it('sends a GET with params and returns data, status and lower-cased headers', async () => {
    fetchMock.mockResolvedValue(json([{ id: 'a' }], 200, { 'X-Trace-Id': 't1' }));

    const response = await http.get('/accounts', { params: { page: 2, skip: undefined } });

    expect(response).toEqual({
      data: [{ id: 'a' }],
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8', 'x-trace-id': 't1' },
    });
    const [url, init] = lastCall();
    expect(url).toBe('http://localhost:5101/api/accounts?page=2');
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('sends the saved token as a bearer authorization header', async () => {
    localStorage.setItem(TOKEN_KEY, 'abc');

    await http.get('/accounts');

    expect(lastCall()[1].headers.Authorization).toBe('Bearer abc');
  });

  it('sends no authorization header without a token', async () => {
    await http.get('/accounts');

    expect(lastCall()[1].headers.Authorization).toBeUndefined();
  });

  it('sends DELETE requests', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ status: 204 }));

    const response = await http.delete('/accounts/a');

    expect(lastCall()[1].method).toBe('DELETE');
    expect(response.status).toBe(204);
    expect(response.data).toBeUndefined();
  });

  it('serializes JSON bodies on POST and PUT and keeps custom headers', async () => {
    await http.post('/accounts', { name: 'Nubank' }, { headers: { 'X-Extra': '1' } });
    expect(lastCall()[1]).toMatchObject({
      method: 'POST',
      body: '{"name":"Nubank"}',
      headers: { 'Content-Type': 'application/json', 'X-Extra': '1' },
    });

    await http.put('/accounts/a', { name: 'Inter' });
    expect(lastCall()[1]).toMatchObject({ method: 'PUT', body: '{"name":"Inter"}', headers: { 'Content-Type': 'application/json' } });
  });

  it('sends no body when POST or PUT receive nothing or null', async () => {
    await http.post('/a');
    expect(lastCall()[1].body).toBeUndefined();
    expect(lastCall()[1].headers['Content-Type']).toBeUndefined();

    await http.put('/a', null);
    expect(lastCall()[1].body).toBeUndefined();
    expect(lastCall()[1].headers['Content-Type']).toBeUndefined();
  });

  it('sends FormData as is and never sets a Content-Type', async () => {
    const form = new FormData();
    form.append('file', 'conteudo');

    await http.post('/files', form, { headers: { 'Content-Type': 'multipart/form-data' } });

    const [, init] = lastCall();
    expect(init.body).toBe(form);
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('serializes bodies as JSON when FormData is not available', async () => {
    const original = globalThis.FormData;
    delete (globalThis as { FormData?: unknown }).FormData;
    try {
      await http.post('/a', { x: 1 });
    } finally {
      globalThis.FormData = original;
    }

    expect(lastCall()[1]).toMatchObject({ body: '{"x":1}', headers: { 'Content-Type': 'application/json' } });
  });

  it('returns text for non-JSON responses', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: 'olá', headers: { 'content-type': 'text/plain' } }));

    await expect(http.get('/a')).resolves.toMatchObject({ data: 'olá' });
  });

  it('returns text when the response has no content type', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: 'cru' }));

    await expect(http.get('/a')).resolves.toMatchObject({ data: 'cru' });
  });

  it('returns the raw text when the JSON is invalid', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: '{quebrado', headers: { 'content-type': 'application/json' } }));

    await expect(http.get('/a')).resolves.toMatchObject({ data: '{quebrado' });
  });

  it('rejects non-2xx responses with an HttpError carrying the response', async () => {
    fetchMock.mockResolvedValue(json({ message: 'Conta já existe' }, 400));

    const error = await http.post('/accounts', { name: 'x' }).catch((e: unknown) => e);

    expect(isHttpError(error)).toBe(true);
    expect(error).toMatchObject({
      name: 'HttpError',
      message: 'Request failed with status 400',
      response: { status: 400, data: { message: 'Conta já existe' } },
    });
  });

  it('calls the unauthorized handler when the API answers 401', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockResolvedValue(fakeResponse({ status: 401 }));

    await expect(http.get('/accounts')).rejects.toBeInstanceOf(HttpError);

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not call the handler for other failures', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockResolvedValueOnce(json({}, 500));
    fetchMock.mockRejectedValueOnce(new Error('rede'));

    await expect(http.get('/a')).rejects.toBeInstanceOf(HttpError);
    await expect(http.get('/a')).rejects.toThrow('rede');

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('tolerates a 401 when no handler is registered', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ status: 401 }));

    await expect(http.get('/a')).rejects.toBeInstanceOf(HttpError);
  });

  it('turns network failures into an HttpError without response', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await http.get('/a').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ message: 'Failed to fetch', response: undefined });
  });

  it('describes failures that are not errors as a network error', async () => {
    fetchMock.mockRejectedValue('desconhecido');

    await expect(http.get('/a')).rejects.toThrow('network error');
  });
});

describe('request timeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('aborts requests that take too long', async () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        })
    );
    const request = http.get('/lento').catch((e: unknown) => e);

    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS - 1);
    expect(lastCall()[1].signal?.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(1);

    const error = await request;
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ message: 'timeout' });
    expect(isServerWaking()).toBe(false);
  });

  it('clears the timeout once the response arrives', async () => {
    await http.get('/rapido');

    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('slow request tracking', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function deferredFetch() {
    let finish: (status: number) => void = () => {};
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = (status) => resolve(json('ok', status));
        })
    );
    return (status: number) => finish(status);
  }

  it('marks a slow successful request and clears it when it answers', async () => {
    const finish = deferredFetch();
    const request = http.get('/accounts');

    await jest.advanceTimersByTimeAsync(SLOW_REQUEST_MS);
    expect(isServerWaking()).toBe(true);

    finish(200);
    await expect(request).resolves.toMatchObject({ data: 'ok' });
    expect(isServerWaking()).toBe(false);
  });

  it('clears a slow failed request and still reports unauthorized', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    const finish = deferredFetch();
    const request = http.get('/accounts');

    await jest.advanceTimersByTimeAsync(SLOW_REQUEST_MS);
    expect(isServerWaking()).toBe(true);

    finish(401);
    await expect(request).rejects.toBeInstanceOf(HttpError);
    expect(isServerWaking()).toBe(false);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not flag requests that answer before the delay', async () => {
    const finish = deferredFetch();
    const request = http.get('/accounts');
    await jest.advanceTimersByTimeAsync(0);
    finish(200);
    await request;

    jest.advanceTimersByTime(SLOW_REQUEST_MS);
    expect(isServerWaking()).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('prefers the message sent by the API', () => {
    expect(getErrorMessage(httpError(400, { message: 'Conta já existe' }), 'Erro')).toBe('Conta já existe');
  });

  it('adds the trace id to server errors', () => {
    expect(getErrorMessage(httpError(500, { traceId: 'abc123' }), 'Erro ao salvar')).toBe('Erro ao salvar.\nCódigo do erro: abc123');
  });

  it('reads the trace id from the response header', () => {
    expect(getErrorMessage(httpError(502, undefined, { 'x-trace-id': 'h1' }), 'Erro')).toBe('Erro.\nCódigo do erro: h1');
  });

  it('falls back when a server error has no trace id', () => {
    expect(getErrorMessage(httpError(500, {}), 'Erro')).toBe('Erro');
  });

  it('ignores the trace id on client errors', () => {
    expect(getErrorMessage(httpError(404, { traceId: 'x' }), 'Não encontrado')).toBe('Não encontrado');
  });

  it('falls back when there is no response', () => {
    expect(getErrorMessage(new HttpError('timeout'), 'Sem conexão')).toBe('Sem conexão');
  });

  it('falls back for errors that did not come from the API', () => {
    expect(getErrorMessage(new Error('x'), 'Erro')).toBe('Erro');
    expect(getErrorMessage('x', 'Erro')).toBe('Erro');
  });

  it('recognizes only HttpError instances', () => {
    expect(isHttpError(new HttpError('x'))).toBe(true);
    expect(isHttpError({ response: { status: 400 } })).toBe(false);
  });
});
