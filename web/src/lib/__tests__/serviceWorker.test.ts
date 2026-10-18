import { Platform } from 'react-native';
import { reportError } from '../logger';
import { registerServiceWorker, SERVICE_WORKER_URL } from '../serviceWorker';

jest.mock('../logger', () => ({ reportError: jest.fn() }));

const register = jest.fn();

function installServiceWorker() {
  Object.defineProperty(navigator, 'serviceWorker', { value: { register }, configurable: true });
}

afterEach(() => {
  delete (navigator as { serviceWorker?: unknown }).serviceWorker;
  jest.restoreAllMocks();
});

describe('registerServiceWorker', () => {
  it('registers the worker in production builds', async () => {
    installServiceWorker();
    register.mockResolvedValue({});

    registerServiceWorker(true);

    expect(register).toHaveBeenCalledWith(SERVICE_WORKER_URL);
    expect(SERVICE_WORKER_URL).toBe('/sw.js');
  });

  it('reports a failed registration as a warning', async () => {
    installServiceWorker();
    const error = new Error('blocked');
    register.mockRejectedValue(error);

    registerServiceWorker(true);

    await Promise.resolve();
    await Promise.resolve();
    expect(reportError).toHaveBeenCalledWith(error, 'warning');
  });

  it('does nothing during development and tests', () => {
    installServiceWorker();

    registerServiceWorker();
    registerServiceWorker(false);

    expect(register).not.toHaveBeenCalled();
  });

  it('does nothing without service worker support or outside the web', () => {
    expect(() => registerServiceWorker(true)).not.toThrow();

    installServiceWorker();
    jest.replaceProperty(Platform, 'OS', 'ios');
    registerServiceWorker(true);

    expect(register).not.toHaveBeenCalled();
  });
});
