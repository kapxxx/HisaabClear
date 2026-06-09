import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'

export default function Login() {
  const { signInWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await signInWithEmail(email, password)
      navigate('/home', { replace: true })
    } catch (err: any) {
      console.error(err)
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
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

  return (
    <div className="auth-page page">
      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-logo">₹</div>
          <h1 className="auth-app-title">Hisab Clear</h1>
          <p className="auth-app-subtitle">Log in to secure and sync your split bills</p>
        </div>

        <div className="auth-card">
          <h2 className="auth-card-title">Welcome Back</h2>

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

          <form onSubmit={handleEmailLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input password-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register" className="auth-link">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
