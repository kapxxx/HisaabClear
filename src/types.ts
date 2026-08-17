// Test comment to verify branch and file editing capability
export interface Participant {
  id: string
  name: string
  paid: number
  /** Optional, e.g. "paid for food" */
  note?: string
}

export interface Transaction {
  id: string
  name: string
  createdAt: string
  participants: Participant[]
}

export interface ParticipantBalance extends Participant {
  share: number
  /** paid − share; positive = should receive, negative = should pay */
  balance: number
}

export interface SettlementTransfer {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

export interface SettlementResult {
  total: number
  sharePerPersonNote: string
  balances: ParticipantBalance[]
  transfers: SettlementTransfer[]
}
