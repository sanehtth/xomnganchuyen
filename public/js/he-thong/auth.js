import { auth, firestore, realtimeDb } from "./firebase.js";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const provider = new GoogleAuthProvider();

/* =========================
   FIRESTORE USER
========================= */
async function ensureFirestoreUser(user) {
  const refDoc = doc(firestore, "users", user.uid);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) {
    await setDoc(refDoc, {
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

/* =========================
   REALTIME USER
========================= */
async function ensureRealtimeUser(user) {
  const rtRef = ref(realtimeDb, `users/${user.uid}`);
  const snap = await get(rtRef);

  if (!snap.exists()) {
    await set(rtRef, {
      uid: user.uid,
      createdAt: Date.now(),
      behavior: {},
      metrics: {},
      time: {}
    });
  }
}

/* =========================
   LOGIN GOOGLE
========================= */
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  await ensureFirestoreUser(user);
  await ensureRealtimeUser(user);
}

/* =========================
   AUTH LISTENER
========================= */
export function initAuth(onReady) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    await ensureFirestoreUser(user);
    await ensureRealtimeUser(user);
    onReady(user);
  });
}
