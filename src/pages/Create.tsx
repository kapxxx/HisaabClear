import { useCallback, useEffect, useState } from 'react'
import { Link, useMatch, useNavigate } from 'react-router-dom'
import { getTransaction, saveTransaction } from '../lib/storage'
import type { Participant } from '../types'

function newRow(): Participant {
  return { id: crypto.randomUUID(), name: '', paid: 0, note: '' }
}

function normalizeParticipant(r: Participant): Participant {
  const name = r.name.trim()
  const paid = Math.max(0, Math.floor(Number(r.paid) || 0))
  const noteTrim = (r.note ?? '').trim()
  const out: Participant = { id: r.id, name, paid }
  if (noteTrim) out.note = noteTrim
  return out
}

export default function Create() {
  const navigate = useNavigate()
  const editMatch = useMatch({ path: '/transaction/:id/edit', end: true })
  const editId = editMatch?.params.id

  const [title, setTitle] = useState('')
  const [rows, setRows] = useState<Participant[]>(() => [newRow(), newRow()])
  const [loadedEditId, setLoadedEditId] = useState<string | null>(null)

  useEffect(() => {
    if (!editId) {
      setLoadedEditId(null)
      return
    }
    const tx = getTransaction(editId)
    if (!tx) {
      navigate('/home', { replace: true })
      return
    }
    setTitle(tx.name)
    setRows(
      tx.participants.map((p) => ({
        id: p.id,
        name: p.name,
        paid: p.paid,
        note: p.note ?? '',
      })),
    )
    setLoadedEditId(editId)
  }, [editId, navigate])

  const updateRow = useCallback((id: string, patch: Partial<Participant>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const addPerson = useCallback(() => {
    setRows((prev) => [...prev, newRow()])
  }, [])

  const removeRow = useCallback((id: string) => {
    setRows((prev) => (prev.length <= 2 ? prev : prev.filter((r) => r.id !== id)))
  }, [])

  const submit = useCallback(() => {
    const name = title.trim()
    if (!name) {
      window.alert('Please enter a transaction name (e.g. Kerala trip).')
      return
    }

    const cleaned = rows.map(normalizeParticipant).filter((r) => r.name.length > 0)

    if (cleaned.length < 2) {
      window.alert('Add at least two people with names.')
      return
    }

    if (editId && loadedEditId === editId) {
      const existing = getTransaction(editId)
      if (!existing) {
        navigate('/home', { replace: true })
        return
      }
      saveTransaction({
        ...existing,
        name,
        participants: cleaned,
      })
      navigate(`/transaction/${editId}`, { replace: true })
      return
    }

    const tx = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      participants: cleaned,
    }
    saveTransaction(tx)
    navigate(`/transaction/${tx.id}`, { replace: true })
  }, [editId, loadedEditId, navigate, rows, title])

  const isEdit = Boolean(editId)
  const backTo = isEdit && editId ? `/transaction/${editId}` : '/home'

  return (
    <div className="page">
      <header className="header header-row">
        <Link className="link-back" to={backTo}>
          {isEdit ? '← Cancel' : '← Home'}
        </Link>
      </header>

      <main className="main">
        <h2 className="section-title">{isEdit ? 'Edit transaction' : 'New transaction'}</h2>

        <label className="field">
          <span className="label">Transaction name</span>
          <input
            className="input"
            placeholder="e.g. Kerala trip"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoComplete="off"
          />
        </label>

        <div className="people-head">
          <span className="label">People &amp; amount paid</span>
          <button type="button" className="btn-text" onClick={addPerson}>
            + Add person
          </button>
        </div>

        <div className="people">
          {rows.map((row, i) => (
            <div className="person-row" key={row.id}>
              <div className="person-fields">
                <input
                  className="input"
                  placeholder={`Person ${i + 1}`}
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  autoComplete="name"
                />
                <div className="paid-wrap">
                  <span className="rupee-prefix">₹</span>
                  <input
                    className="input input-paid"
                    inputMode="numeric"
                    placeholder="0"
                    value={row.paid === 0 ? '' : String(row.paid)}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '')
                      updateRow(row.id, { paid: v === '' ? 0 : Number(v) })
                    }}
                  />
                </div>
                <input
                  className="input input-note"
                  placeholder="Paid for (optional), e.g. food"
                  value={row.note ?? ''}
                  onChange={(e) => updateRow(row.id, { note: e.target.value })}
                  autoComplete="off"
                />
              </div>
              {rows.length > 2 && (
                <button
                  type="button"
                  className="btn-icon"
                  aria-label="Remove person"
                  onClick={() => removeRow(row.id)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" className="btn btn-primary btn-block" onClick={submit}>
          {isEdit ? 'Save changes' : 'Hisab Clear'}
        </button>
      </main>
    </div>
  )
}
