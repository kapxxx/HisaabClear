import type { Transaction } from '../types'
import { backupToCloud } from './sync'

function getUserKey(uid: string): string {
  return `hisab-clear-transactions-${uid}-v1`
}

function readRaw(uid: string): Transaction[] {
  if (!uid) return []
  try {
    const raw = localStorage.getItem(getUserKey(uid))
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

export function loadTransactions(uid: string): Transaction[] {
  return readRaw(uid).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function saveTransaction(tx: Transaction, uid: string): void {
  if (!uid) return
  const list = readRaw(uid).filter((t) => t.id !== tx.id)
  list.push(tx)
  localStorage.setItem(getUserKey(uid), JSON.stringify(list))

  // Trigger background cloud sync
  backupToCloud(uid, list)
}

export function getTransaction(id: string, uid: string): Transaction | undefined {
  return readRaw(uid).find((t) => t.id === id)
}

export function deleteTransactions(ids: string[], uid: string): void {
  if (!uid || ids.length === 0) return
  const idSet = new Set(ids)
  const list = readRaw(uid).filter((t) => !idSet.has(t.id))
  localStorage.setItem(getUserKey(uid), JSON.stringify(list))

  // Trigger background cloud sync
  backupToCloud(uid, list)
}
