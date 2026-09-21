import { Link } from 'react-router-dom'
import { getSessionIdentity } from '../auth/session.js'
import { getStoredTheme, setTheme, themeLabel } from '../theme/theme.js'
import './ProfileSettings.css'

const THEME_OPTIONS = ['light', 'dark', 'system']

export default function ProfileSettings() {
  const identity = getSessionIdentity()
  const email = identity?.email ?? '—'
  const currentTheme = getStoredTheme()

  return (
    <div className="profile-settings">
      <h1>Profile settings</h1>
      <section className="profile-settings__card" aria-labelledby="profile-identity-heading">
        <h2 id="profile-identity-heading">Signed-in account</h2>
        <dl className="profile-settings__dl">
          <dt>Email</dt>
          <dd>{email}</dd>
        </dl>
        <p className="profile-settings__note">
          Additional profile fields will be available when your organization connects a user directory.
        </p>
      </section>
      <section className="profile-settings__card" aria-labelledby="profile-theme-heading">
        <h2 id="profile-theme-heading">Theme</h2>
        <p className="profile-settings__theme-current">Current: {themeLabel(currentTheme)}</p>
        <div className="profile-settings__theme-options" role="group" aria-label="Theme preference">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={
                option === currentTheme
                  ? 'profile-settings__theme-btn profile-settings__theme-btn--active'
                  : 'profile-settings__theme-btn'
              }
              onClick={() => setTheme(option)}
            >
              {themeLabel(option)}
            </button>
          ))}
        </div>
      </section>
      <Link to="/home" className="profile-settings__back">Back to Landing</Link>
    </div>
  )
}
