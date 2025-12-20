import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DB_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);

export function listenUser(uid, cb) {
  const userRef = ref(db, `users/${uid}`);
  return onValue(userRef, (snap) => cb(snap.val()));
}

export function ensureUserProfile(user) {
  const userRef = ref(db, `users/${user.uid}`);
  const payload = {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    xp: 0,
    level: 1,
    coin: 0,
  };
  return set(userRef, payload);
}

export async function loginWithGoogle() {
  const res = await signInWithPopup(auth, googleProvider);
  const user = res.user;
  await ensureUserProfile(user);
  return user;
}

export function logout() {
  return signOut(auth);
}