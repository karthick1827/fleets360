import { Navigate, useLocation } from 'react-router-dom'
import { getLogoutReason, hasValidSession } from './session.js'

export default function RequireAuth({ children }) {
  const location = useLocation()

  if (!hasValidSession()) {
    const flash = getLogoutReason() === 'expired' ? 'session-expired' : undefined
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, flash }}
      />
    )
  }

  return children
}
