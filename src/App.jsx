import { Navigate, Route, Routes } from 'react-router-dom'
import GuestOnly from './auth/GuestOnly.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import AuthenticatedLayout from './layouts/AuthenticatedLayout.jsx'
import Login from './pages/Login.jsx'
import Landing from './pages/Landing.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Placeholder from './pages/Placeholder.jsx'
import ProfileSettings from './pages/ProfileSettings.jsx'

const DOMAIN_SHELLS = {
  devices: {
    title: 'Devices',
    description: 'Device management module — full functionality ships in a later release.',
  },
  sites: {
    title: 'Sites',
    description: 'Site management module — full functionality ships in a later release.',
  },
  users: {
    title: 'Users',
    description: 'User and role management module — full functionality ships in a later release.',
  },
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <Login />
          </GuestOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestOnly>
            <ForgotPassword />
          </GuestOnly>
        }
      />
      <Route
        element={
          <RequireAuth>
            <AuthenticatedLayout />
          </RequireAuth>
        }
      >
        <Route path="/home" element={<Landing />} />
        <Route path="/profile" element={<ProfileSettings />} />
        <Route path="/devices" element={<Placeholder {...DOMAIN_SHELLS.devices} />} />
        <Route path="/sites" element={<Placeholder {...DOMAIN_SHELLS.sites} />} />
        <Route path="/users" element={<Placeholder {...DOMAIN_SHELLS.users} />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
