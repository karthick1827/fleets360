import { establishSession } from './session.js'

export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.'

const DEV_STUB_ENABLED = import.meta.env.VITE_AUTH_STUB !== 'false'

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * @returns {Promise<{ ok: true } | { ok: false, code: string, message: string }>}
 */
export async function loginUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase()

  if (!isValidEmail(normalizedEmail) || !password) {
    return {
      ok: false,
      code: 'INVALID_CREDENTIALS',
      message: INVALID_CREDENTIALS_MESSAGE,
    }
  }

  if (!DEV_STUB_ENABLED) {
    return {
      ok: false,
      code: 'AUTH_UNAVAILABLE',
      message: 'Sign-in is not available. Configure the auth API.',
    }
  }

  // Dev stub: any valid email + non-empty password. Replace with api/authClient when backend exists.
  establishSession({ email: normalizedEmail })
  return { ok: true }
}
