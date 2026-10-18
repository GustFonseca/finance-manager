export async function getItem(key: string): Promise<string | null> {
  return localStorage.getItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  localStorage.setItem(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  localStorage.removeItem(key);
}
