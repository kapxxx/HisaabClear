import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = window.setTimeout(() => navigate('/home', { replace: true }), 1600)
    return () => window.clearTimeout(t)
  }, [navigate])

  return (
    <div className="splash">
      <div className="splash-mark">₹</div>
      <h1 className="splash-title">Hisab Clear</h1>
      <p className="splash-tagline">Split trips. Settle fast.</p>
    </div>
  )
}
