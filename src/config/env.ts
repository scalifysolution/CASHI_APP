/**
 * MERCHANT_PORTAL_URL is read from the root `.env` file at bundle time
 * (see babel.config.js + babel-plugin-transform-inline-environment-variables).
 */
export const MERCHANT_PORTAL_URL = process.env.MERCHANT_PORTAL_URL ?? 'https://cashi.app';

/** External store signup / Start Cashi web flow (opened via Linking). */
export const STORE_SIGNUP_URL = process.env.STORE_SIGNUP_URL ?? 'https://www.ufff.com';

const DEFAULT_API_BASE = 'https://cashi-staging-backend.vercel.app/api';

/** Normalize .env mistakes: spaces, missing `/api`, duplicate `/api/api`. */
function normalizeApiBase(raw: string | undefined): string {
  if (raw == null || !String(raw).trim()) return DEFAULT_API_BASE;
  let s = String(raw).trim().replace(/\s+/g, '');
  s = s.replace(/\/+$/, '');
  s = s.replace(/\/api\/api$/i, '/api');
  if (!/\/api$/i.test(s)) {
    s = `${s}/api`;
  }
  return s;
}

/** Cashi backend base URL (must end with `/api`). */
export const API_BASE_URL = normalizeApiBase(process.env.API_BASE_URL);

/** Optional Google Maps API key used for reverse geocoding in app UI. */
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? '';
