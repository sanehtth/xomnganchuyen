// public/js/he-thong/auth.js
// Auth flow: Google login -> ensure Firestore doc -> ensure RTDB node -> callback
import {
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "./firebase.js";

import { ensureUserDocument } from "../data/userData.js";
import { ensureRealtimeUser } from "../data/realtimeUser.js";

const authState = {
  loading: true,
  firebaseUser: null,
  profile: null,
  unsub: null,
};

export function getAuthState() {
  return { ...authState };
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logout() {
  await signOut(auth);
}

// callback(firebaseUser, profile)
export function subscribeAuthState(callback) {
  if (authState.unsub) authState.unsub();

  authState.unsub = onAuthStateChanged(auth, async (firebaseUser) => {
    authState.loading = true;
    authState.firebaseUser = firebaseUser || null;
    authState.profile = null;

    try {
      if (!firebaseUser) {
        authState.loading = false;
        if (typeof callback === "function") callback(null, null);
        return;
      }

      // 1) Firestore: ensure user doc (link key id stored here)
      const profile = await ensureUserDocument(firebaseUser);

      // 2) RTDB: ensure behavior tracking node exists
      await ensureRealtimeUser(firebaseUser.uid, profile);

      authState.profile = profile;
      authState.loading = false;

      if (typeof callback === "function") callback(firebaseUser, profile);
    } catch (err) {
      console.error("Lỗi khi xử lý onAuthStateChanged:", err);
      authState.loading = false;
      if (typeof callback === "function") callback(firebaseUser || null, null);
    }
  });

  return authState.unsub;
}
