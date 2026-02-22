const isWeb = typeof localStorage !== 'undefined';

async function getSecureStore() {
  return await import('expo-secure-store');
}

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(key);
  }
  const SecureStore = await getSecureStore();
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(key, value);
    return;
  }
  const SecureStore = await getSecureStore();
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(key);
    return;
  }
  const SecureStore = await getSecureStore();
  await SecureStore.deleteItemAsync(key);
}
