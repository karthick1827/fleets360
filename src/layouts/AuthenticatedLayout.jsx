import { Outlet } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar.jsx'
import './AuthenticatedLayout.css'

export default function AuthenticatedLayout() {
  return (
    <div className="auth-shell">
      <AppNavbar />
      <main className="auth-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
