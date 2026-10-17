const mockPost = jest.fn(() => Promise.resolve());
jest.mock('../http', () => ({ http: { post: mockPost } }));

/** The logger keeps per-page-load counters, so each test gets a fresh module. */
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
