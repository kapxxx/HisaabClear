import { useCallback, useMemo, useState } from 'react'
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

  return (
    <div className="page">
      <header className="header">
        <h1 className="header-title">Hisab Clear</h1>
        <p className="header-sub">Your settlements</p>
      </header>

      <main className="main">
        {hasList && (
          <div className="bulk-bar">
            <button type="button" className="btn-text" onClick={toggleAll}>
              {selCount === transactions.length ? 'Clear all' : 'Select all'}
            </button>
            {selCount > 0 && (
              <button type="button" className="btn-text" onClick={clearSelection}>
                Clear selection
              </button>
            )}
            <button
              type="button"
              className="btn-danger-inline"
              disabled={selCount === 0}
              onClick={deleteSelected}
            >
              Delete{selCount ? ` (${selCount})` : ''}
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
                  <label className="list-check">
                    <input
                      type="checkbox"
                      checked={selected.has(tx.id)}
                      onChange={() => toggle(tx.id)}
                    />
                    <span className="sr-only">Select {tx.name}</span>
                  </label>
                  <Link className="list-item" to={`/transaction/${tx.id}`}>
                    <span className="list-index">{index + 1}.</span>
                    <span className="list-name">{tx.name}</span>
                    <span className="list-chevron" aria-hidden>
                      →
                    </span>
                  </Link>
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
