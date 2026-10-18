import { Platform } from 'react-native';
import { reportError } from './logger';

export const SERVICE_WORKER_URL = '/sw.js';

export function registerServiceWorker(production = process.env.NODE_ENV === 'production'): void {
  if (Platform.OS !== 'web' || !production || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register(SERVICE_WORKER_URL).catch((error) => reportError(error, 'warning'));
}
