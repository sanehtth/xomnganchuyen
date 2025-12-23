// public/js/he-thong/auth.js
// Quan ly dang nhap/thoat va theo doi auth state

import {
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "./firebase.js";

import { ensureUserDocument } from "../data/userData.js";
import { ensureRealtimeUser } from "../data/realtimeUser.js";

/**
 * Dang nhap bang Google.
 */
export async function loginWithGoogle() {
  await signInWithPopup(auth, googleProvider);
}

/**
 * Dang xuat.
 */
export async function logout() {
  await signOut(auth);
}

/**
 * Subscribe auth state.
 * callback(firebaseUser, profile)
 */
export function subscribeAuthState(callback) {
  const cb = typeof callback === "function" ? callback : () => {};

  return onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (!firebaseUser) {
        cb(null, null);
        return;
      }

      // 1) Dam bao Firestore user document ton tai
      const profile = await ensureUserDocument(firebaseUser.uid, {
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
      });

      // 2) Dam bao Realtime user record ton tai (chi tracking hanh vi)
      // Neu RTDB rules/region co van de thi ham nay se fail im lang (console.warn)
      await ensureRealtimeUser(firebaseUser.uid, profile);

      cb(firebaseUser, profile);
    } catch (err) {
      console.error("Loi khi xu ly onAuthStateChanged:", err);
      cb(firebaseUser || null, null);
    }
  });
}

// Backward compatible alias (neu file cu import initAuth)
export function initAuth(callback) {
  return subscribeAuthState(callback);
}
