import Constants from 'expo-constants';
import { Platform } from 'react-native';

// works for android emulator and iOS simulator
const BASE_URL = __DEV__ && Platform.OS === 'android' 
  ? 'http://10.0.2.2:3000/'
  : 'http://localhost:3000/';

export type ApiError = { status?: number; message: string };

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    signal,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {}
    const err: ApiError = { status: res.status, message };
    throw err;
  }
  return (await res.json()) as T;
}

// for getting local images (for develoepment/testing, not used in production)
export function getImageUrl(imagePath: string | undefined): string {
  if (imagePath) {
    return `${BASE_URL}${imagePath}`;
  }
  return '';
}
