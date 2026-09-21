import { Link } from 'react-router-dom'
import logoFleet360 from '../assets/fleet360/logo-fleet360-landing.svg'
import ProfileMenu from './ProfileMenu.jsx'
import './AppNavbar.css'

export default function AppNavbar() {
  return (
    <header className="app-navbar">
      <div className="app-navbar__inner">
        <Link to="/home" className="app-navbar__brand">
          <img src={logoFleet360} alt="Fleet 360" className="app-navbar__logo" />
        </Link>
        <ProfileMenu />
      </div>
    </header>
  )
}
