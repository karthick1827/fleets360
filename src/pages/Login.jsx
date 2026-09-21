import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loginUser } from '../auth/loginUser.js'
import { TERMS_AND_PRIVACY_URL } from '../config/legal.js'
import logoFleet360 from '../assets/fleet360/logo-fleet360-login.svg'
import logoAcl from '../assets/fleet360/logo-acl-digital.svg'
import loginHero from '../assets/fleet360/login-hero.png'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef(null)

  const sessionFlash =
    location.state?.flash === 'session-expired'
      ? 'Your session has expired. Please sign in again.'
      : ''

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const form = formRef.current
    if (form && !form.checkValidity()) {
      form.reportValidity()
      return
    }
    setSubmitting(true)
    try {
      const result = await loginUser(email, password)
      if (!result.ok) {
        setError(result.message)
        return
      }
      const redirectTo = location.state?.from?.pathname ?? '/home'
      navigate(redirectTo, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page" data-node-id="1228:11322">
      <div className="login-page__bg" aria-hidden="true">
        <div className="login-page__photo-clip">
          <div className="login-page__hero-wrap">
            <img className="login-page__hero" src={loginHero} alt="" />
          </div>
        </div>
        <div className="login-page__gradient" />
      </div>

      <div className="login-page__panel" data-node-id="4045:14272">
        <div className="login-page__brand">
          <img
            className="login-page__logo"
            src={logoFleet360}
            alt="Fleet 360"
            width={202}
            height={36}
          />
        </div>

        <form ref={formRef} className="login-page__form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label className="login-field__label" htmlFor="email">Email</label>
            <input
              id="email"
              className="login-field__input"
              type="email"
              name="email"
              placeholder="Enter Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label className="login-field__label" htmlFor="password">Password</label>
            <input
              id="password"
              className="login-field__input"
              type="password"
              name="password"
              placeholder="Enter Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="login-field__row">
              <Link className="login-field__link" to="/forgot-password">
                Forgot Password?
              </Link>
            </div>
          </div>

          {(sessionFlash || error) && (
            <p className="login-page__error" role="alert">
              {error || sessionFlash}
            </p>
          )}

          <button className="login-page__submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Login'}
          </button>

          <p className="login-page__legal">
            By clicking login, you hereby agree to our
            <br />
            <a
              href={TERMS_AND_PRIVACY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms and Conditions &amp; Privacy Notice
            </a>
          </p>
        </form>

        <div className="login-page__powered" data-node-id="4045:14221">
          <span className="login-page__powered-text">Powered by</span>
          <img
            className="login-page__acl-logo"
            src={logoAcl}
            alt="ACL Digital"
            width={125}
            height={36}
          />
        </div>
      </div>
    </div>
  )
}
