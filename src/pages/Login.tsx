import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'

type LoginView = 'LOGIN' | 'FORGOT_PASSWORD'

export default function Login() {
  const { signInWithEmail, signInWithGoogle, sendPasswordReset } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [view, setView] = useState<LoginView>('LOGIN')
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (trimmedEmail.length > 50) {
      setError('Email cannot exceed 50 characters.')
      return
    }

    if (trimmedPassword.length > 20) {
      setError('Password cannot exceed 20 characters.')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await signInWithEmail(trimmedEmail, trimmedPassword)
      navigate('/home', { replace: true })
    } catch (err: any) {
      console.error(err)
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setError(
          'Invalid email or password. If you signed up using Google, click "Continue with Google" or reset your password.'
        )
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError(err.message || 'An error occurred during sign-in.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate('/home', { replace: true })
    } catch (err: any) {
      console.error(err)
      if (err.message && err.message.includes('cancel')) {
        // User cancelled, do not display error
        return
      }
      setError(err.message || 'Google Sign-In failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('Please enter your email address first.')
      return
    }

    if (trimmedEmail.length > 50) {
      setError('Email cannot exceed 50 characters.')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await sendPasswordReset(trimmedEmail)
      setSuccess("Password reset link sent! Check your inbox — if you don't see it, please check your spam folder too.")
      setView('LOGIN')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to send password reset link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page page">
      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-logo">₹</div>
          <h1 className="auth-app-title">Hisab Clear</h1>
          <p className="auth-app-subtitle">Log in to secure your split bills</p>
        </div>

        <div className="auth-card">
          <h2 className="auth-card-title">
            {view === 'LOGIN' ? 'Welcome Back' : 'Reset Password'}
          </h2>

          {error && (
            <div className="auth-error-banner animate-slide-down">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="auth-success-banner animate-slide-down" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>{success}</span>
            </div>
          )}

          {view === 'LOGIN' ? (
            /* LOGIN VIEW */
            <>
              <form onSubmit={handleEmailLogin} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.slice(0, 50))}
                    maxLength={50}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="password">Password</label>
                    <button
                      type="button"
                      className="btn-text"
                      style={{ fontSize: '0.8rem', padding: 0 }}
                      onClick={() => {
                        setError('')
                        setSuccess('')
                        setView('FORGOT_PASSWORD')
                      }}
                      disabled={loading}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="password-input-wrapper">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input password-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value.slice(0, 20))}
                      maxLength={20}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <span className="btn-spinner"></span> : 'Sign In'}
                </button>
              </form>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="btn btn-google"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="google-icon" width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.137 4.114-3.468 0-6.277-2.81-6.277-6.277 0-3.468 2.81-6.277 6.277-6.277 1.579 0 3.012.587 4.114 1.554l3.033-3.033C18.99 1.94 15.827 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.875 0 10.87-4.218 10.87-11.24 0-.693-.06-1.365-.175-1.955H12.24z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          ) : (
            /* FORGOT PASSWORD VIEW */
            <form onSubmit={handleForgotPassword} className="auth-form">
              <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                We'll email you a secure link to reset your password. Once updated, you can log in using either Email/Password or Google!
              </p>
              
              <div className="form-group">
                <label htmlFor="reset-email">Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.slice(0, 50))}
                  maxLength={50}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="btn-spinner"></span> : 'Send Reset Link'}
              </button>

              <button
                type="button"
                className="btn-text"
                style={{ width: '100%', marginTop: '0.75rem', textAlign: 'center' }}
                onClick={() => {
                  setError('')
                  setSuccess('')
                  setView('LOGIN')
                }}
                disabled={loading}
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>

        {view === 'LOGIN' && (
          <div className="auth-footer">
            <p>
              Don't have an account? <Link to="/register" className="auth-link">Sign Up</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
