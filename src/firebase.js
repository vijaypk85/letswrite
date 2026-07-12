// Firebase setup — every service used here is on Firebase's free "Spark" plan
// (Auth + Firestore + Hosting), so this app costs nothing to run at small scale.
//
// 1. Go to https://console.firebase.google.com -> Add project
// 2. Project settings -> General -> Add app -> Web app. Copy the config values
//    into a `.env` file at the project root (see `.env.example`).
// 3. Build > Authentication -> Get started -> enable "Google" sign-in provider.
// 4. Build > Firestore Database -> Create database -> start in production mode.
//    Then paste the rules from `firestore.rules` into the Firestore "Rules" tab.

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
