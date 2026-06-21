import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="splash fade-in">
        <div className="splash-mark loader-pulse" style={{ background: 'none', boxShadow: 'none' }}>
          <img src="/icon.png" alt="Hisab Clear Logo" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'contain' }} />
        </div>
        <h2 className="loading-text">Loading secure session...</h2>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
