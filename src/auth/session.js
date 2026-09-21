const SESSION_STORAGE_KEY = 'fleet360.session'
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000

let logoutReason = null

function readRecord() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.exp !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export function establishSession(identity = {}) {
  const exp = Date.now() + SESSION_TTL_MS
  const email =
    typeof identity.email === 'string' && identity.email.trim()
      ? identity.email.trim().toLowerCase()
      : null
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ exp, email }))
  logoutReason = null
}

export function getSessionIdentity() {
  if (!hasValidSession()) {
    return null
  }
  const record = readRecord()
  return { email: record?.email ?? null }
}

export function clearSession(reason = null) {
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
  logoutReason = reason
}

export function getLogoutReason() {
  return logoutReason
}

export function hasValidSession() {
  const record = readRecord()
  if (!record) {
    return false
  }
  if (record.exp <= Date.now()) {
    clearSession('expired')
    return false
  }
  return true
}
