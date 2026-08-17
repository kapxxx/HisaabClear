import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'

export default function Splash() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (user) {
      navigate('/home', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [navigate, user, loading])

  return (
    <div className="splash">
      <div className="splash-mark" style={{ background: 'none', boxShadow: 'none' }}>
        <img src="/icon.png" alt="Hisab Clear Logo" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'contain' }} />
      </div>
      <h1 className="splash-title">Hisab Clear</h1>
      <p className="splash-tagline">Split trips. Settle fast.</p>
    </div>
  )
}
