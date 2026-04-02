/**
 * MERCHANT_PORTAL_URL is read from the root `.env` file at bundle time
 * (see babel.config.js + babel-plugin-transform-inline-environment-variables).
 */
export const MERCHANT_PORTAL_URL = process.env.MERCHANT_PORTAL_URL ?? 'https://cashi.app';

/** External store signup / Start Cashi web flow (opened via Linking). */
export const STORE_SIGNUP_URL = process.env.STORE_SIGNUP_URL ?? 'https://www.ufff.com';
