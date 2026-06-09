import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCir7dD-gk64fg8JYpFjBBWEcPuh9Be44w",
  authDomain: "hisab-clear-9092e.firebaseapp.com",
  projectId: "hisab-clear-9092e",
  storageBucket: "hisab-clear-9092e.firebasestorage.app",
  messagingSenderId: "269023699761",
  appId: "1:269023699761:web:106b3e7e076a0d97214610",
  measurementId: "G-RPR73PSF6P"
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig)

// Initialize Firebase Auth
export const auth = getAuth(app)

// Initialize Firestore with persistent offline caching
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
})
