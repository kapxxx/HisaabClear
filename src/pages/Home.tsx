import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { deleteTransactions, loadTransactions } from '../lib/storage'

export default function Home() {
  const location = useLocation()
  const [tick, setTick] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const transactions = useMemo(
    () => loadTransactions(),
    [location.key, location.pathname, tick],
  )

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (transactions.length === 0) return
    setSelected((prev) => {
      if (prev.size === transactions.length) return new Set()
      return new Set(transactions.map((t) => t.id))
    })
  }, [transactions])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  const deleteSelected = useCallback(() => {
    if (selected.size === 0) return
    const n = selected.size
    const ok = window.confirm(
      n === 1
        ? 'Delete this transaction? This cannot be undone.'
        : `Delete ${n} transactions? This cannot be undone.`,
    )
    if (!ok) return
    deleteTransactions([...selected])
    setSelected(new Set())
    setTick((t) => t + 1)
  }, [selected])

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

  return (
    <div className="page">
      <header className="header">
        <h1 className="header-title">Hisab Clear</h1>
        <p className="header-sub">Your settlements</p>
      </header>

      <main className="main">
        {hasList && selCount > 0 && (
          <div className="bulk-bar">
            <button type="button" className="btn-text" onClick={toggleAll}>
              {selCount === transactions.length ? 'Clear all' : 'Select all'}
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
        ) : (
          <ul className="list">
            {transactions.map((tx, index) => (
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

        <Link className="btn btn-primary" to="/create">
          Make transaction
        </Link>
      </main>
    </div>
  )
}
