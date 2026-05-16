import type {
  Participant,
  ParticipantBalance,
  SettlementResult,
  SettlementTransfer,
} from '../types'

/** Integer rupees: split total across n people; first `remainder` get +1 */
function sharesPerPerson(total: number, n: number, participantIds: string[]): Map<string, number> {
  const base = Math.floor(total / n)
  const remainder = total % n
  const map = new Map<string, number>()
  participantIds.forEach((id, index) => {
    map.set(id, base + (index < remainder ? 1 : 0))
  })
  return map
}

export function computeSettlement(participants: Participant[]): SettlementResult {
  const n = participants.length
  if (n === 0) {
    return {
      total: 0,
      sharePerPersonNote: '—',
      balances: [],
      transfers: [],
    }
  }
  const total = participants.reduce((s, p) => s + p.paid, 0)
  const shareMap = sharesPerPerson(
    total,
    n,
    participants.map((p) => p.id),
  )

  const balances: ParticipantBalance[] = participants.map((p) => {
    const share = shareMap.get(p.id) ?? 0
    return {
      ...p,
      share,
      balance: p.paid - share,
    }
  })

  const debtors = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ ...b, owe: -b.balance }))
  const creditors = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ ...b, receive: b.balance }))

  const transfers: SettlementTransfer[] = []
  let di = 0
  let ci = 0

  while (di < debtors.length && ci < creditors.length) {
    const d = debtors[di]
    const c = creditors[ci]
    const amount = Math.min(d.owe, c.receive)
    if (amount > 0) {
      transfers.push({
        fromId: d.id,
        fromName: d.name,
        toId: c.id,
        toName: c.name,
        amount,
      })
    }
    d.owe -= amount
    c.receive -= amount
    if (d.owe === 0) di += 1
    if (c.receive === 0) ci += 1
  }

  const sharePerPersonNote =
    remainderHint(total, n)

  return { total, sharePerPersonNote, balances, transfers }
}

function remainderHint(total: number, n: number): string {
  const base = Math.floor(total / n)
  const r = total % n
  if (r === 0) return `₹${base} each (equal split)`
  return `₹${base}–₹${base + 1} each (${r} person(s) pay ₹${base + 1} so the total matches exactly)`
}

export function formatRupees(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}
