import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../auth/requestPasswordReset.js'
import logoFleet360 from '../assets/fleet360/logo-fleet360-login.svg'
import './ForgotPassword.css'

export default function ForgotPassword() {
  const formRef = useRef(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const form = formRef.current
    if (form && !form.checkValidity()) {
      form.reportValidity()
      return
    }

    setSubmitting(true)
    try {
      const result = await requestPasswordReset(email)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setSuccess(result.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="forgot-page">
      <div className="forgot-page__panel">
        <img
          className="forgot-page__logo"
          src={logoFleet360}
          alt="Fleet 360"
          width={202}
          height={36}
        />
        <h1 className="forgot-page__title">Forgot password</h1>
        <p className="forgot-page__lead">
          Enter the email associated with your account. We will send reset instructions when
          password recovery is enabled for your organization.
        </p>

        <form ref={formRef} className="forgot-page__form" onSubmit={handleSubmit} noValidate>
          <div className="forgot-field">
            <label className="forgot-field__label" htmlFor="reset-email">Email</label>
            <input
              id="reset-email"
              className="forgot-field__input"
              type="email"
              name="email"
              placeholder="Enter Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="forgot-page__feedback forgot-page__feedback--error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="forgot-page__feedback forgot-page__feedback--success" role="status">
              {success}
            </p>
          )}

          <button className="forgot-page__submit" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <Link className="forgot-page__back" to="/login">Back to Login</Link>
      </div>
    </div>
  )
}
