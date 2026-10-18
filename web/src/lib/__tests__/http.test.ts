import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { getErrorMessage, http, setUnauthorizedHandler, TOKEN_KEY } from '../http';

function axiosError(status?: number, data?: unknown, headers: Record<string, string> = {}) {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  const response = status ? { status, statusText: '', data, headers, config } : undefined;
  return new AxiosError('falhou', 'ERR', config, null, response);
}

function okAdapter() {
  return jest.fn(async (config: InternalAxiosRequestConfig) => ({
    data: 'ok',
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }));
}

afterEach(() => setUnauthorizedHandler(null));

describe('http client', () => {
  it('sends the saved token as a bearer authorization header', async () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    const adapter = okAdapter();

    await http.get('/accounts', { adapter });

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer abc');
  });

  it('sends no authorization header without a token', async () => {
    const adapter = okAdapter();

    await http.get('/accounts', { adapter });

    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });

  it('calls the unauthorized handler when the API answers 401', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);

    await expect(http.get('/accounts', { adapter: () => Promise.reject(axiosError(401)) })).rejects.toBeInstanceOf(
      AxiosError
    );

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not call the handler for other failures', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);

    await expect(http.get('/a', { adapter: () => Promise.reject(axiosError(500)) })).rejects.toBeInstanceOf(AxiosError);
    await expect(http.get('/a', { adapter: () => Promise.reject(new Error('rede')) })).rejects.toThrow('rede');

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('tolerates a 401 when no handler is registered', async () => {
    await expect(http.get('/a', { adapter: () => Promise.reject(axiosError(401)) })).rejects.toBeInstanceOf(AxiosError);
  });

  it('points to the local API by default', () => {
    expect(http.defaults.baseURL).toBe('http://localhost:5101/api');
    expect(http.defaults.timeout).toBe(90_000);
  });

  it('uses the configured API url when present', () => {
    const previous = process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_API_URL = 'https://api.exemplo.com';
    jest.isolateModules(() => {
      expect(require('../http').http.defaults.baseURL).toBe('https://api.exemplo.com');
    });
    process.env.EXPO_PUBLIC_API_URL = previous;
  });
});

describe('getErrorMessage', () => {
  it('prefers the message sent by the API', () => {
    expect(getErrorMessage(axiosError(400, { message: 'Conta já existe' }), 'Erro')).toBe('Conta já existe');
  });

  it('adds the trace id to server errors', () => {
    expect(getErrorMessage(axiosError(500, { traceId: 'abc123' }), 'Erro ao salvar')).toBe(
      'Erro ao salvar.\nCódigo do erro: abc123'
    );
  });

  it('reads the trace id from the response header', () => {
    expect(getErrorMessage(axiosError(502, undefined, { 'x-trace-id': 'h1' }), 'Erro')).toBe(
      'Erro.\nCódigo do erro: h1'
    );
  });

  it('falls back when a server error has no trace id', () => {
    expect(getErrorMessage(axiosError(500, {}), 'Erro')).toBe('Erro');
  });

  it('ignores the trace id on client errors', () => {
    expect(getErrorMessage(axiosError(404, { traceId: 'x' }), 'Não encontrado')).toBe('Não encontrado');
  });

  it('falls back when there is no response', () => {
    expect(getErrorMessage(axiosError(), 'Sem conexão')).toBe('Sem conexão');
  });

  it('falls back for errors that did not come from the API', () => {
    expect(getErrorMessage(new Error('x'), 'Erro')).toBe('Erro');
    expect(getErrorMessage('x', 'Erro')).toBe('Erro');
  });
});
