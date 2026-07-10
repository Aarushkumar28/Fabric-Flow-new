import { getSupabaseAccessToken } from '@/lib/auth';

type Primitive = string | number | boolean | null | undefined;

interface RequestOptions extends RequestInit {
  params?: Record<string, Primitive>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(endpoint, API_URL || window.location.origin);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const authHeader: Record<string, string> = {};
  try {
    const token = await getSupabaseAccessToken();
    if (token) {
      authHeader.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Session unavailable. Continue without auth header.
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(options.headers ?? {}),
    },
    body:
      options.body && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body,
  });

  // 401 redirect disabled (auth temporarily removed).
  if (response.status === 401) {
    throw new Error('Session expired.');
  }

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message ?? message;
    } catch {
      const text = await response.text().catch(() => '');
      if (text) message = text;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
