import { useCallback, useEffect, useState } from 'react'
import { Link, useMatch, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import { getTransaction, saveTransaction, loadTransactions } from '../lib/storage'
import type { Participant } from '../types'

interface RowData extends Participant {
  paidInput?: string
}

function newRow(): RowData {
  return { id: crypto.randomUUID(), name: '', paid: 0, paidInput: '', note: '' }
}

function normalizeParticipant(r: RowData): Participant {
  const name = r.name.trim()
  const paid = Math.max(0, Math.floor(Number(r.paid) || 0))
  const noteTrim = (r.note ?? '').trim()
  const out: Participant = { id: r.id, name, paid }
  if (noteTrim) out.note = noteTrim
  return out
}

export default function Create() {
  const { user } = useAuth()
  const uid = user?.uid || ''

  const navigate = useNavigate()
  const editMatch = useMatch({ path: '/transaction/:id/edit', end: true })
  const editId = editMatch?.params.id

  const [title, setTitle] = useState('')
  const [rows, setRows] = useState<RowData[]>(() => [newRow(), newRow()])
  const [loadedEditId, setLoadedEditId] = useState<string | null>(null)

  const [showNotes, setShowNotes] = useState(false)
  const [errors, setErrors] = useState<{
    title?: string
    rows?: { name?: string; paid?: string }[]
  }>({})

  useEffect(() => {
    if (!editId || !uid) {
      setLoadedEditId(null)
      return
    }
    const tx = getTransaction(editId, uid)
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
        paidInput: String(p.paid),
        note: p.note ?? '',
      })),
    )
    if (tx.participants.some(p => (p.note ?? '').trim().length > 0)) {
      setShowNotes(true)
    }
    setLoadedEditId(editId)
  }, [editId, navigate, uid])

  const updateRow = useCallback((id: string, patch: Partial<RowData>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    setErrors((prev) => {
      if (!prev.rows) return prev
      const i = rows.findIndex((r) => r.id === id)
      if (i < 0) return prev
      const newRows = [...prev.rows]
      const err = { ...newRows[i] }
      if (patch.name !== undefined && patch.name.trim()) delete err.name
      if (patch.paidInput !== undefined && patch.paidInput.trim() !== '') delete err.paid
      newRows[i] = err
      return { ...prev, rows: newRows }
    })
  }, [rows])

  const addPerson = useCallback(() => {
    setRows((prev) => [...prev, newRow()])
  }, [])

  const removeRow = useCallback((id: string) => {
    setRows((prev) => (prev.length <= 2 ? prev : prev.filter((r) => r.id !== id)))
    setErrors((prev) => {
      if (!prev.rows) return prev
      const i = rows.findIndex((r) => r.id === id)
      if (i < 0) return prev
      const newRows = prev.rows.filter((_, idx) => idx !== i)
      return { ...prev, rows: newRows }
    })
  }, [rows])

  const submit = useCallback(() => {
    if (!uid) return

    let hasError = false
    const newErrors: { title?: string; rows?: { name?: string; paid?: string }[] } = {
      rows: rows.map(() => ({})),
    }

    const name = title.trim()
    if (!name) {
      newErrors.title = 'Transaction name is required'
      hasError = true
    }

    const rowErrors = rows.map((r) => {
      const err: { name?: string; paid?: string } = {}
      if (!r.name.trim()) {
        err.name = 'Name is required'
        hasError = true
      }
      if (r.paidInput === undefined || r.paidInput.trim() === '') {
        err.paid = 'Amount is required'
        hasError = true
      }
      return err
    })

    newErrors.rows = rowErrors
    setErrors(newErrors)

    if (hasError) return

    const cleaned = rows.map(normalizeParticipant)

    if (cleaned.length < 2) {
      window.alert('Add at least two people.')
      return
    }

    if (editId && loadedEditId === editId) {
      const existing = getTransaction(editId, uid)
      if (!existing) {
        navigate('/home', { replace: true })
        return
      }
      saveTransaction({
        ...existing,
        name,
        participants: cleaned,
      }, uid)
      navigate(`/transaction/${editId}`, { replace: true })
      return
    }

    const allTx = loadTransactions(uid)
    if (allTx.length >= 50) {
      window.alert('Maximum limit of 50 transactions reached. Please delete some to create new ones.')
      return
    }

    const tx = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      participants: cleaned,
    }
    saveTransaction(tx, uid)
    navigate(`/transaction/${tx.id}`, { replace: true })
  }, [editId, loadedEditId, navigate, rows, title, uid])

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="label">Transaction name</span>
            <span className="muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{title.length}/20</span>
          </div>
          <input
            className={`input ${errors.title ? 'is-invalid' : ''}`}
            placeholder="e.g. trip"
            value={title}
            onChange={(e) => {
              const val = e.target.value
              if (val.length <= 20) {
                setTitle(val)
                if (val.trim()) setErrors((prev) => ({ ...prev, title: undefined }))
              }
            }}
            autoComplete="off"
            maxLength={20}
          />
          {errors.title && <span className="error-msg">{errors.title}</span>}
        </label>

        <div className="people-head">
          <span className="label">People &amp; amount paid</span>
          <label className="toggle-wrap">
            <input
              type="checkbox"
              checked={showNotes}
              onChange={(e) => setShowNotes(e.target.checked)}
            />
            Show Notes
          </label>
        </div>

        <div className="people">
          {rows.map((row, i) => (
            <div key={row.id}>
              <div className="person-row">
                <div className="person-fields">
                  <div className="row-fields">
                    <div>
                      <input
                        className={`input ${errors.rows?.[i]?.name ? 'is-invalid' : ''}`}
                        placeholder={`Person ${i + 1}`}
                        value={row.name}
                        onChange={(e) => {
                          const v = e.target.value
                          if (v.length <= 20) {
                            updateRow(row.id, { name: v })
                          }
                        }}
                        autoComplete="name"
                        maxLength={20}
                      />
                      {errors.rows?.[i]?.name && <div className="error-msg">{errors.rows[i].name}</div>}
                    </div>
                    <div>
                      <div className="paid-wrap">
                        <span className="rupee-prefix">₹</span>
                        <input
                          className={`input input-paid ${errors.rows?.[i]?.paid ? 'is-invalid' : ''}`}
                          inputMode="numeric"
                          placeholder="0"
                          value={row.paidInput ?? (row.paid === 0 ? '' : String(row.paid))}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '')
                            if (v.length <= 10) {
                              updateRow(row.id, { paid: v === '' ? 0 : Number(v), paidInput: v })
                            }
                          }}
                          maxLength={10}
                        />
                      </div>
                      {errors.rows?.[i]?.paid && <div className="error-msg">{errors.rows[i].paid}</div>}
                    </div>
                  </div>
                  {showNotes && (
                    <div className="note-field">
                      <input
                        className="input input-note"
                        placeholder="Paid for (optional), e.g. food"
                        value={row.note ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          if (v.length <= 50) {
                            updateRow(row.id, { note: v })
                          }
                        }}
                        autoComplete="off"
                        maxLength={50}
                      />
                    </div>
                  )}
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
              <hr className="divider" />
            </div>
          ))}
          {rows.length < 15 ? (
            <button type="button" className="btn-text" onClick={addPerson} style={{ alignSelf: 'flex-start' }}>
              + Add person
            </button>
          ) : (
            <p className="muted" style={{ fontSize: '0.85rem' }}>Maximum of 15 people reached.</p>
          )}
        </div>

        <button type="button" className="btn btn-primary btn-block" onClick={submit}>
          {isEdit ? 'Save changes' : 'Hisab Clear'}
        </button>
      </main>
    </div>
  )
}
