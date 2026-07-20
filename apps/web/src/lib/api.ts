const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3061/api/v1';
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}
export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}
