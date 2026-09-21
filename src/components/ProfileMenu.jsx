import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSessionIdentity } from '../auth/session.js'
import { signOut } from '../auth/signOut.js'
import { cycleTheme, getStoredTheme, themeLabel } from '../theme/theme.js'
import './ProfileMenu.css'

function avatarInitials(email) {
  if (!email) return 'OP'
  const local = email.split('@')[0] ?? ''
  if (local.length >= 2) return local.slice(0, 2).toUpperCase()
  if (local.length === 1) return local.toUpperCase()
  return 'OP'
}

export default function ProfileMenu() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [themePref, setThemePref] = useState(() => getStoredTheme())
  const rootRef = useRef(null)
  const menuId = useId()
  const identity = getSessionIdentity()
  const initials = avatarInitials(identity?.email)

  function closeAndFocusTrigger() {
    setOpen(false)
    requestAnimationFrame(() => {
      rootRef.current?.querySelector('.profile-menu__trigger')?.focus()
    })
  }

  useEffect(() => {
    if (!open) return undefined
    const items = Array.from(
      rootRef.current?.querySelectorAll('[role="menuitem"]') ?? [],
    )
    items[0]?.focus()

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        closeAndFocusTrigger()
      }
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeAndFocusTrigger()
        return
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      if (!items.length) return
      event.preventDefault()
      const active = document.activeElement
      const index = items.indexOf(active)
      const nextIndex =
        event.key === 'ArrowDown'
          ? (index + 1) % items.length
          : (index - 1 + items.length) % items.length
      items[nextIndex]?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function goProfile() {
    closeAndFocusTrigger()
    navigate('/profile')
  }

  function handleTheme() {
    const next = cycleTheme()
    setThemePref(next)
  }

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="profile-menu" ref={rootRef}>
      <button
        type="button"
        className="profile-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="profile-menu__avatar" aria-hidden="true">{initials}</span>
        <span className="profile-menu__label">Profile</span>
      </button>
      {open ? (
        <div
          id={menuId}
          className="profile-menu__dropdown"
          role="menu"
          aria-label="Profile"
        >
          <button type="button" role="menuitem" className="profile-menu__item" onClick={goProfile}>
            Profile settings
          </button>
          <button type="button" role="menuitem" className="profile-menu__item" onClick={handleTheme}>
            Theme: {themeLabel(themePref)}
          </button>
          <button type="button" role="menuitem" className="profile-menu__item" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
