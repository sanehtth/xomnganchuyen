
// js/he-thong/auth.js
// Quan ly trang thai dang nhap bang Firebase Auth

import {
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "./firebase.js";
import { ensureUserDocument, getUserDocument } from "../data/userData.js";

// Bien global don gian de giu trang thai hien tai
export const authState = {
  firebaseUser: null,
  profile: null,
};

// Dang nhap bang Google
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  // Dam bao co document user trong Firestore
  await ensureUserDocument(user);
  return user;
}

// Dang xuat
export async function logout() {
  await signOut(auth);
}

// Dang ky listener thay doi trang thai auth
// callback se nhan (firebaseUser, profile)
export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    authState.firebaseUser = firebaseUser;
    if (!firebaseUser) {
      authState.profile = null;
      callback(null, null);
      return;
    }
    // Dam bao document ton tai + doc lai profile
    await ensureUserDocument(firebaseUser);
    const fresh = await getUserDocument(firebaseUser.uid);
    authState.profile = fresh;
    callback(firebaseUser, fresh);
  });
}
