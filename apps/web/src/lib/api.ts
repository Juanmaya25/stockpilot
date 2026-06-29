import { DEMO, demoRequest } from './demo';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'sp_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (DEMO) {
    const method = (options.method ?? 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body as string) : undefined;
    return demoRequest<T>(path, method, body);
  }

  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message;
      }
    } catch {
      // non-JSON error body; keep the default message
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
