import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { Transaction } from '../types'

const LEGACY_KEY = 'hisab-clear-transactions-v1'

/**
 * Backs up the transaction list to Firestore.
 * Because Firestore offline persistence is enabled, this will update the local cache
 * immediately and sync in the background once online.
 */
export async function backupToCloud(uid: string, transactions: Transaction[]): Promise<void> {
  if (!uid) return
  try {
    const userDoc = doc(db, 'users', uid, 'backup', 'data')
    await setDoc(userDoc, {
      transactions,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error backing up to cloud:', error)
  }
}

/**
 * Restores the transaction list from Firestore.
 */
export async function restoreFromCloud(uid: string): Promise<Transaction[] | null> {
  if (!uid) return null
  try {
    const userDoc = doc(db, 'users', uid, 'backup', 'data')
    const docSnap = await getDoc(userDoc)
    if (docSnap.exists()) {
      const data = docSnap.data()
      return (data.transactions || []) as Transaction[]
    }
  } catch (error) {
    console.error('Error restoring from cloud:', error)
  }
  return null
}

/**
 * Migrates local guest transactions (stored before login) to the user's account storage.
 */
export async function migrateLegacyData(uid: string): Promise<void> {
  if (!uid) return
  try {
    const legacyData = localStorage.getItem(LEGACY_KEY)
    if (legacyData) {
      const userKey = `hisab-clear-transactions-${uid}-v1`
      const existingUserData = localStorage.getItem(userKey)

      if (!existingUserData) {
        // Simple move
        localStorage.setItem(userKey, legacyData)
        localStorage.removeItem(LEGACY_KEY)
        const parsed = JSON.parse(legacyData) as Transaction[]
        await backupToCloud(uid, parsed)
        console.log('Legacy guest data successfully migrated to user account.')
      } else {
        // Merge guest and user transactions, removing duplicates
        const guestList = JSON.parse(legacyData) as Transaction[]
        const userList = JSON.parse(existingUserData) as Transaction[]

        const merged = [...userList]
        const userIds = new Set(userList.map((t) => t.id))
        for (const tx of guestList) {
          if (!userIds.has(tx.id)) {
            merged.push(tx)
          }
        }

        localStorage.setItem(userKey, JSON.stringify(merged))
        localStorage.removeItem(LEGACY_KEY)
        await backupToCloud(uid, merged)
        console.log('Legacy guest data merged into user account.')
      }
    }
  } catch (error) {
    console.error('Error migrating legacy data:', error)
  }
}
