/**
 * Auth API integration point (AD-3). Production: httpOnly session cookie via fetch to AUTH_API_URL.
 * Until VITE_AUTH_API_URL is set, login uses the dev stub in src/auth/loginUser.js.
 */
export const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL ?? ''

export function isAuthApiConfigured() {
  return Boolean(AUTH_API_URL)
}
