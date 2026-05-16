import type { Transaction } from '../types'

const KEY = 'hisab-clear-transactions-v1'

function readRaw(): Transaction[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isTransaction)
  } catch {
    return []
  }
}

function isTransaction(x: unknown): x is Transaction {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.createdAt === 'string' &&
    Array.isArray(o.participants) &&
    o.participants.every(
      (p) =>
        p &&
        typeof p === 'object' &&
        typeof (p as ParticipantLike).id === 'string' &&
        typeof (p as ParticipantLike).name === 'string' &&
        typeof (p as ParticipantLike).paid === 'number' &&
        ((p as ParticipantLike).note === undefined ||
          typeof (p as ParticipantLike).note === 'string'),
    )
  )
}

interface ParticipantLike {
  id: string
  name: string
  paid: number
  note?: string
}

export function loadTransactions(): Transaction[] {
  return readRaw().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function saveTransaction(tx: Transaction): void {
  const list = readRaw().filter((t) => t.id !== tx.id)
  list.push(tx)
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function getTransaction(id: string): Transaction | undefined {
  return readRaw().find((t) => t.id === id)
}

export function deleteTransactions(ids: string[]): void {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const list = readRaw().filter((t) => !idSet.has(t.id))
  localStorage.setItem(KEY, JSON.stringify(list))
}
