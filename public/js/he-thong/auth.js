import { auth, db, rtdb } from "./firebase.js";

import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const provider = new GoogleAuthProvider();

/* =====================
   FIRESTORE USER
===================== */
async function ensureFirestoreUser(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      role: "guest",
      status: "normal",
      joinCode: "",
      level: 1,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      S_metrics: { S_xp: 0, S_coin: 0, S_level: 1 },
      S_behavior: {},
      S_time: {}
    });
  }
}

/* =====================
   REALTIME USER
===================== */
async function ensureRealtimeUser(user) {
  const userRef = ref(rtdb, `users/${user.uid}`);
  const snap = await get(userRef);

  if (!snap.exists()) {
    await set(userRef, {
      uid: user.uid,
      createdAt: Date.now(),
      behavior: {},
      metrics: {},
      time: {}
    });
  }
}

/* =====================
   LOGIN
===================== */
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  await ensureFirestoreUser(user);
  await ensureRealtimeUser(user);
}

/* =====================
   AUTH LISTENER
===================== */
export function initAuth(onReady) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    await ensureFirestoreUser(user);
    await ensureRealtimeUser(user);

    onReady(user);
  });
}
