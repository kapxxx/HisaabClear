import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithCredential,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { auth } from '../lib/firebase'
import { migrateLegacyData, restoreFromCloud } from '../lib/sync'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, pass: string) => Promise<void>
  signUpWithEmail: (email: string, pass: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 1. Migrate any guest data to this user's account
        await migrateLegacyData(firebaseUser.uid)

        // 2. If local storage is empty for this user, restore backup from Firestore
        const userKey = `hisab-clear-transactions-${firebaseUser.uid}-v1`
        const localData = localStorage.getItem(userKey)
        if (!localData || localData === '[]') {
          const cloudData = await restoreFromCloud(firebaseUser.uid)
          if (cloudData && cloudData.length > 0) {
            localStorage.setItem(userKey, JSON.stringify(cloudData))
            // Notify active components to reload storage
            window.dispatchEvent(new Event('storage-sync'))
          }
        }
        setUser(firebaseUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass)
  }

  const signUpWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass)
  }

  const signInWithGoogle = async () => {
    if (Capacitor.isNativePlatform()) {
      // Native Google Sign-In using Capawesome
      const result = await FirebaseAuthentication.signInWithGoogle()
      const idToken = result.credential?.idToken
      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID Token returned')
      }
      const credential = GoogleAuthProvider.credential(idToken)
      await signInWithCredential(auth, credential)
    } else {
      // Web browser Sign-In using Firebase SDK popup
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    }
  }

  const signOutUser = async () => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut()
    }
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
