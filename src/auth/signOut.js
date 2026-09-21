import { clearSession } from './session.js'

export function signOut() {
  clearSession('logout')
}
