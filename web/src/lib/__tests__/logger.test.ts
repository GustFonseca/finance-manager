const mockPost = jest.fn(() => Promise.resolve());
jest.mock('../http', () => ({ http: { post: mockPost } }));

function freshLogger(): typeof import('../logger') {
  let logger!: typeof import('../logger');
  jest.isolateModules(() => {
    logger = require('../logger');
  });
  return logger;
}

beforeEach(() => mockPost.mockClear());

describe('reportError', () => {
  it('sends the error name, message and stack to the API', () => {
    freshLogger().reportError(new TypeError('x is undefined'));

    expect(mockPost).toHaveBeenCalledWith(
      '/client-logs',
      expect.objectContaining({
        level: 'error',
        message: 'TypeError: x is undefined',
        stack: expect.stringContaining('TypeError'),
      })
    );
  });

  it('reports the same message only once in a short window', () => {
    const { reportError } = freshLogger();
    reportError(new Error('boom'));
    reportError(new Error('boom'));
    reportError(new Error('other'));

    expect(mockPost).toHaveBeenCalledTimes(2);
  });

  it('stops after a few reports per page load', () => {
    const { reportError } = freshLogger();
    for (let i = 0; i < 25; i++) reportError(`erro ${i}`);

    expect(mockPost).toHaveBeenCalledTimes(10);
  });

  it('never throws when the report itself fails', async () => {
    mockPost.mockImplementationOnce(() => Promise.reject(new Error('offline')));

    expect(() => freshLogger().reportError('falhou')).not.toThrow();
    await Promise.resolve();
  });
});

describe('reportError details', () => {
  it('sends warnings with their level', () => {
    freshLogger().reportError('cuidado', 'warning');

    expect(mockPost).toHaveBeenCalledWith('/client-logs', expect.objectContaining({ level: 'warning', message: 'cuidado' }));
  });

  it('describes non-error values as JSON', () => {
    const { reportError } = freshLogger();
    reportError({ code: 42 });
    reportError(undefined);

    expect(mockPost).toHaveBeenCalledWith('/client-logs', expect.objectContaining({ message: '{"code":42}' }));
    expect(mockPost).toHaveBeenCalledWith('/client-logs', expect.objectContaining({ message: 'undefined' }));
  });

  it('includes the page url and the browser', () => {
    freshLogger().reportError('x');

    expect(mockPost).toHaveBeenCalledWith(
      '/client-logs',
      expect.objectContaining({ url: location.href, userAgent: navigator.userAgent })
    );
  });

  it('omits the browser when it is not available', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', { value: undefined, configurable: true });
    try {
      freshLogger().reportError('sem navegador');
    } finally {
      if (original) Object.defineProperty(globalThis, 'navigator', original);
    }

    expect(mockPost).toHaveBeenCalledWith('/client-logs', expect.objectContaining({ userAgent: undefined }));
  });

  it('reports the same message again after the quiet window', () => {
    jest.useFakeTimers();
    const { reportError } = freshLogger();
    reportError('repetido');
    jest.advanceTimersByTime(10_001);
    reportError('repetido');
    jest.useRealTimers();

    expect(mockPost).toHaveBeenCalledTimes(2);
  });
});

describe('installGlobalErrorReporting', () => {
  it('reports uncaught errors and unhandled rejections until uninstalled', () => {
    const { installGlobalErrorReporting } = freshLogger();
    const uninstall = installGlobalErrorReporting();

    window.dispatchEvent(new ErrorEvent('error', { error: new RangeError('fora do limite') }));
    window.dispatchEvent(new ErrorEvent('error', { message: 'Script error.' }));
    const rejection = Object.assign(new Event('unhandledrejection'), { reason: new Error('promessa') });
    window.dispatchEvent(rejection);

    expect(mockPost).toHaveBeenCalledWith('/client-logs', expect.objectContaining({ message: 'RangeError: fora do limite' }));
    expect(mockPost).toHaveBeenCalledWith('/client-logs', expect.objectContaining({ message: 'Script error.' }));
    expect(mockPost).toHaveBeenCalledWith('/client-logs', expect.objectContaining({ message: 'Error: promessa' }));

    uninstall();
    mockPost.mockClear();
    window.dispatchEvent(new ErrorEvent('error', { message: 'depois' }));
    window.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: 'depois' }));

    expect(mockPost).not.toHaveBeenCalled();
  });
});
