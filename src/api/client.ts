import { API_BASE_URL } from '../config/env';
import { ApiException, parseJsonSafe } from './http';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
  method?: HttpMethod;
  token?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
};

function resolveUrl(path: string) {
  const base = API_BASE_URL.replace(/\/$/, '');
  let p = path.startsWith('/') ? path : `/${path}`;
  if (base.endsWith('/api') && (p.startsWith('/api/') || p === '/api')) {
    p = p.replace(/^\/api/, '') || '/';
  }
  return `${base}${p}`;
}

function defaultHeadersForBase(): Record<string, string> {
  const h: Record<string, string> = {};
  const lower = API_BASE_URL.toLowerCase();
  if (lower.includes('ngrok-free.app') || lower.includes('ngrok.io')) {
    h['ngrok-skip-browser-warning'] = 'true';
  }
  return h;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.token ?? null;

  const res = await fetch(resolveUrl(path), {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...defaultHeadersForBase(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!res.ok) {
    const data = await parseJsonSafe(res);
    const msg =
      (typeof data === 'object' && data && 'message' in data && (data as any).message) ||
      res.statusText ||
      'Request failed';
    throw new ApiException(
      Array.isArray(msg) ? msg.join(', ') : String(msg),
      res.status,
    );
  }

  const data = (await parseJsonSafe(res)) as T;
  return data;
}

