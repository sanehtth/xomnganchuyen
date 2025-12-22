// js/he-thong/auth.js
// Cac ham xu ly dang nhap / dang xuat va lang nghe trang thai auth

import { auth, googleProvider } from "./firebase.js";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { ensureUserDocument } from "../data/userData.js";

// ----------------------
// Dang nhap voi Google
// ----------------------
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const firebaseUser = result.user;

  // Tao / cap nhat ho so user trong Firestore
  const profile = await ensureUserDocument(firebaseUser);

  return { firebaseUser, profile };
}

// ----------------------
// Dang xuat
// ----------------------
export async function logout() {
  // 1) Dang xuat khoi Firebase Auth
  await signOut(auth);

  // 2) Sau khi dang xuat, dua ve trang landing / trang chu
  // Netlify se map "/" -> index.html
  window.location.href = "/";
}

// ----------------------
// Lang nghe thay doi auth
// callback(firebaseUser, profile)
// ----------------------
export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      // Khong co ai dang nhap
      callback(null, null);
      return;
    }

    // Co user dang nhap -> dam bao ho so ton tai trong Firestore
    const profile = await ensureUserDocument(firebaseUser);
    callback(firebaseUser, profile);
  });
}
