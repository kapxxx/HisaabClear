import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import { deleteTransactions, loadTransactions } from '../lib/storage'

export default function Home() {
  const { user, signOutUser } = useAuth()
  const uid = user?.uid || ''

  const location = useLocation()
  const [tick, setTick] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [searchQuery, setSearchQuery] = useState('')
  // Sidebar and Custom Logout Modal States
  const [showSidebar, setShowSidebar] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Reload transactions when storage is synced from the cloud
  useEffect(() => {
    const handleSync = () => {
      setTick((t) => t + 1)
    }
    window.addEventListener('storage-sync', handleSync)
    return () => window.removeEventListener('storage-sync', handleSync)
  }, [])

  const transactions = useMemo(
    () => loadTransactions(uid),
    [location.key, location.pathname, tick, uid],
  )

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions
    const q = searchQuery.toLowerCase()
    return transactions.filter((t) => t.name.toLowerCase().includes(q))
  }, [transactions, searchQuery])

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (filteredTransactions.length === 0) return
    setSelected((prev) => {
      if (prev.size === filteredTransactions.length) return new Set()
      return new Set(filteredTransactions.map((t) => t.id))
    })
  }, [filteredTransactions])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  const deleteSelected = useCallback(() => {
    if (selected.size === 0 || !uid) return
    const n = selected.size
    const ok = window.confirm(
      n === 1
        ? 'Delete this transaction? This cannot be undone.'
        : `Delete ${n} transactions? This cannot be undone.`,
    )
    if (!ok) return
    deleteTransactions([...selected], uid)
    setSelected(new Set())
    setTick((t) => t + 1)
  }, [selected, uid])

  const hasList = transactions.length > 0
  const selCount = selected.size

  useEffect(() => {
    ;(window as any).isSelectionMode = selCount > 0
    return () => {
      ;(window as any).isSelectionMode = false
    }
  }, [selCount])

  useEffect(() => {
    const handleCustomBack = () => {
      setSelected(new Set())
    }
    window.addEventListener('clear-selection', handleCustomBack)
    return () => window.removeEventListener('clear-selection', handleCustomBack)
  }, [])

  const timerRef = useRef<number | null>(null)

  const handlePointerDown = (id: string) => {
    if (selCount > 0) return
    timerRef.current = window.setTimeout(() => {
      toggle(id)
      timerRef.current = null
    }, 500)
  }

  const handlePointerUpOrLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'User'

  return (
    <div className="page">
      <header className="header sticky-header">
        <div className="header-top-row">
          <div className="header-titles">
            <h1 className="header-title">Hisab Clear</h1>
            <p className="header-sub">Hi, {firstName}</p>
          </div>
          <div className="header-profile">
            <button
              type="button"
              className="profile-avatar-btn"
              onClick={() => setShowSidebar(true)}
              title="View Profile"
            >
              {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : '👤'}
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {hasList && (
          <div className="search-container">
            <span className="search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              className="search-input"
              placeholder="Search transactions..."
              maxLength={20}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.slice(0, 20))}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        )}

        {hasList && selCount > 0 && (
          <div className="bulk-bar">
            <button type="button" className="btn-text" onClick={toggleAll}>
              {selCount === filteredTransactions.length ? 'Clear all' : 'Select all'}
            </button>
            <button type="button" className="btn-text" onClick={clearSelection}>
              Clear selection
            </button>
            <button
              type="button"
              className="btn-danger-inline"
              disabled={selCount === 0}
              onClick={deleteSelected}
            >
              Delete ({selCount})
            </button>
          </div>
        )}

        {!hasList ? (
          <div className="empty">
            <p className="empty-title">Welcome to Hisab Clear</p>
            <p className="empty-text">
              Create a transaction when friends chip in for a trip or outing. We will
              tell you exactly who should pay whom.
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty">
            <p className="empty-title">No transactions found</p>
            <p className="empty-text">
              We couldn't find any transactions matching "{searchQuery}".
            </p>
          </div>
        ) : (
          <ul className="list">
            {filteredTransactions.map((tx, index) => (
              <li key={tx.id}>
                <div className="list-item-row">
                  {selCount > 0 && (
                    <label className="list-check">
                      <input
                        type="checkbox"
                        checked={selected.has(tx.id)}
                        onChange={() => toggle(tx.id)}
                      />
                      <span className="sr-only">Select {tx.name}</span>
                    </label>
                  )}
                  {selCount > 0 ? (
                    <div
                      className="list-item"
                      onClick={() => toggle(tx.id)}
                      style={{ cursor: 'pointer', flex: 1 }}
                    >
                      <span className="list-index">{index + 1}.</span>
                      <span className="list-name">{tx.name}</span>
                    </div>
                  ) : (
                    <Link
                      className="list-item"
                      to={`/transaction/${tx.id}`}
                      onTouchStart={() => handlePointerDown(tx.id)}
                      onTouchEnd={handlePointerUpOrLeave}
                      onTouchMove={handlePointerUpOrLeave}
                      onMouseDown={() => handlePointerDown(tx.id)}
                      onMouseUp={handlePointerUpOrLeave}
                      onMouseLeave={handlePointerUpOrLeave}
                      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                      }}
                    >
                      <span className="list-index">{index + 1}.</span>
                      <span className="list-name">{tx.name}</span>
                      <span className="list-chevron" aria-hidden>
                        →
                      </span>
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <Link
          className="btn-fab"
          to="/create"
          title="Make transaction"
          onClick={(e) => {
            if (transactions.length >= 50) {
              e.preventDefault()
              window.alert('Maximum limit of 50 transactions reached. Please delete some to create new ones.')
            }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Make transaction</span>
        </Link>
      </main>

      {/* Profile Sidebar Drawer */}
      {showSidebar && (
        <div className="profile-sidebar-overlay fade-in" onClick={() => setShowSidebar(false)}>
          <div className="profile-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="profile-sidebar-header">
              <h3 className="profile-sidebar-title">Account Details</h3>
              <button 
                type="button" 
                className="btn-close-sidebar" 
                onClick={() => setShowSidebar(false)}
                aria-label="Close Profile"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="profile-sidebar-content">
              <div className="profile-sidebar-avatar-large animate-pulse-subtle">
                {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : '👤'}
              </div>
              <div className="profile-sidebar-info">
                <h4 className="profile-sidebar-name">{user?.displayName || 'User'}</h4>
                <p className="profile-sidebar-email">{user?.email || 'No email associated'}</p>
              </div>
            </div>

            <div className="profile-sidebar-footer">
              <button 
                type="button" 
                className="btn-danger-sidebar" 
                onClick={() => setShowLogoutConfirm(true)}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Logout Confirmation Alert Modal */}
      {showLogoutConfirm && (
        <div className="logout-confirm-overlay fade-in">
          <div className="logout-confirm-card scale-in">
            <div className="logout-confirm-icon">⚠️</div>
            <h3 className="logout-confirm-title">Are you sure you want to logout?</h3>
            <p className="logout-confirm-desc">You will need to sign in again to access your transactions.</p>
            <div className="logout-confirm-buttons">
              <button 
                type="button" 
                className="btn-highlight-no"
                onClick={() => setShowLogoutConfirm(false)}
                autoFocus
              >
                No, Keep Me In
              </button>
              <button 
                type="button" 
                className="btn-danger-text" 
                onClick={async () => {
                  setShowLogoutConfirm(false)
                  setShowSidebar(false)
                  await signOutUser()
                }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
