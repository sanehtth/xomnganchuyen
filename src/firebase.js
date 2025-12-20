// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import {
  getDatabase,
  ref,
  get,
  set,
  update,
  onValue,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCsy8_u9ELGMiur-YyKsDYu1oU8YSpZKXY",
  authDomain: "xomnganchuyen.firebaseapp.com",
  databaseURL: "https://xomnganchuyen-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "xomnganchuyen",
  storageBucket: "xomnganchuyen.firebasestorage.app",
  messagingSenderId: "335661705640",
  appId: "1:335661705640:web:8bde062fae1fcb3c99559d",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);

export function listenUser(uid, cb) {
  const userRef = ref(db, `users/${uid}`);
  return onValue(userRef, (snap) => cb(snap.val()));
}

export async function ensureUserProfile(user) {
  const userRef = ref(db, `users/${user.uid}`);
  const snap = await get(userRef);

  const now = Date.now();

  let base = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName ?? "",
    photoURL: user.photoURL ?? "",
    lastActiveAt: now,
  };

  if (!snap.exists()) {
    let newUser = {
      ...base,
      createdAt: now,
      role: "guest",
      status: "pending",
      xp: 0,
      coin: 0,
      level: 0,
      joinCode: "",
    };

    await set(userRef, newUser);
    return newUser;
  }

  let current = snap.val();

  await update(userRef, base);

  return { ...current, ...base };
}

export async function loginWithGoogle() {
  const res = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(res.user);
  return res.user;
}

export async function logout() {
  await signOut(auth);
}
