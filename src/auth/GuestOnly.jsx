import { Navigate } from 'react-router-dom'
import { hasValidSession } from './session.js'

export default function GuestOnly({ children }) {
  if (hasValidSession()) {
    return <Navigate to="/home" replace />
  }
  return children
}
