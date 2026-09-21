function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * MVP stub — replace with api/authClient when backend exists.
 * @returns {Promise<{ ok: true } | { ok: false, code: string, message: string }>}
 */
export async function requestPasswordReset(email) {
  const normalized = email.trim().toLowerCase()
  if (!isValidEmail(normalized)) {
    return {
      ok: false,
      code: 'INVALID_EMAIL',
      message: 'Enter a valid email address.',
    }
  }

  return {
    ok: true,
    message:
      'If an account exists for that email, you will receive password reset instructions shortly.',
  }
}
