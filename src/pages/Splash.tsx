import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'

export default function Splash() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    const t = window.setTimeout(() => {
      if (user) {
        navigate('/home', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }, 1600)

    return () => window.clearTimeout(t)
  }, [navigate, user, loading])

  return (
    <div className="splash">
      <div className="splash-mark">₹</div>
      <h1 className="splash-title">Hisab Clear</h1>
      <p className="splash-tagline">Split trips. Settle fast.</p>
    </div>
  )
}
