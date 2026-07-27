import { createContext, useContext, useEffect, useState } from 'react'
import {
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase.js'

const AuthContext = createContext(null)

function describeAuthError(err) {
  switch (err.code) {
    case 'auth/unauthorized-domain':
      return (
        'This domain isn\'t authorized for sign-in yet. In the Firebase console, go to ' +
        'Authentication → Settings → Authorized domains, and add this site\'s domain.'
      )
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    case 'auth/invalid-api-key':
      return (
        'Firebase API key is missing or invalid on this deployment. Check that the ' +
        'VITE_FIREBASE_* environment variables are set in your hosting provider and redeploy.'
      )
    case 'auth/configuration-not-found':
      return 'Google sign-in isn\'t enabled for this Firebase project yet — enable it under Authentication → Sign-in method.'
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.'
    case 'auth/popup-closed-by-user':
      return 'Sign-in was closed before finishing. Please try again.'
    case 'auth/network-request-failed':
      return 'Network error while signing in. Check your connection and try again.'
    default:
      return `Could not sign in (${err.code || 'unknown error'}). Please try again.`
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await loadOrCreateProfile(firebaseUser)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function loadOrCreateProfile(firebaseUser) {
    try {
      const ref = doc(db, 'users', firebaseUser.uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setProfile(snap.data())
        return
      }
      // First time this person has signed in — create their profile doc,
      // seeded with the name Google gave us. They can change it later from
      // the Settings page.
      const newProfile = {
        displayName: firebaseUser.displayName || 'Anonymous',
        email: firebaseUser.email || null,
        createdAt: serverTimestamp(),
      }
      await setDoc(ref, newProfile)
      setProfile(newProfile)
    } catch (err) {
      console.error('Could not load profile', err)
    }
  }

  async function loginWithGoogle() {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error(err)
      setError(describeAuthError(err))
    }
  }

  async function logout() {
    await signOut(auth)
  }

  async function updateDisplayName(newName) {
    const trimmed = newName.trim()
    if (!trimmed) throw new Error('Display name cannot be empty.')
    if (!user) throw new Error('You must be signed in.')

    await updateDoc(doc(db, 'users', user.uid), { displayName: trimmed })
    setProfile((prev) => ({ ...prev, displayName: trimmed }))
  }

  async function deleteAccount() {
    if (!user) throw new Error('You must be signed in.')

    // Google sign-in sessions can go "stale" — Firebase requires a *recent*
    // sign-in before it will let you delete the account, so re-prompt
    // Google sign-in right before deleting anything.
    await reauthenticateWithPopup(user, googleProvider)

    // Delete every story this account has published.
    const storiesQuery = query(collection(db, 'stories'), where('authorId', '==', user.uid))
    const storiesSnap = await getDocs(storiesQuery)
    await Promise.all(storiesSnap.docs.map((d) => deleteDoc(d.ref)))

    // Delete the profile document.
    await deleteDoc(doc(db, 'users', user.uid))

    // Finally, delete the Firebase Auth account itself. This must happen
    // last — once it succeeds, `user` is no longer authenticated and
    // further Firestore writes as this user would be rejected.
    await deleteUser(user)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        loginWithGoogle,
        logout,
        updateDisplayName,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
