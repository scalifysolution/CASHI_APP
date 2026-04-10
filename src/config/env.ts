/**
 * Values below are read from `CASHI_APP/.env` at bundle time where listed in babel.config.js
 * (`babel-plugin-transform-inline-environment-variables`), including GOOGLE_MAPS_API_KEY.
 */
import { Platform } from 'react-native';

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

function normalizeAndroidLocalhost(url: string) {
  if (Platform.OS !== 'android') return url;
  return url
    .replace(/^http:\/\/localhost(?=[:/]|$)/i, 'http://10.0.2.2')
    .replace(/^http:\/\/127\.0\.0\.1(?=[:/]|$)/i, 'http://10.0.2.2')
    .replace(/^https:\/\/localhost(?=[:/]|$)/i, 'https://10.0.2.2')
    .replace(/^https:\/\/127\.0\.0\.1(?=[:/]|$)/i, 'https://10.0.2.2');
}

/** Cashi backend base URL (must end with `/api`). */
export const API_BASE_URL = normalizeAndroidLocalhost(
  normalizeApiBase(process.env.API_BASE_URL),
);

function normalizeGoogleMapsKey(raw: string | undefined): string {
  if (raw == null || !String(raw).trim()) return '';
  return String(raw)
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

/**
 * Inlined from `.env` at bundle time (add `GOOGLE_MAPS_API_KEY` in babel.config.js `include`).
 * Enable **Geocoding API** in Google Cloud for this key.
 */
export const GOOGLE_MAPS_API_KEY = normalizeGoogleMapsKey(process.env.GOOGLE_MAPS_API_KEY);
