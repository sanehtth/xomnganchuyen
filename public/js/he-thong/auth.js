// js/he-thong/auth.js
// Quản lý đăng nhập / đăng xuất + trạng thái auth toàn cục

import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "./firebase.js";

import {
  ensureUserDocument,
  getUserDocument,
} from "../data/userData.js";

// Trạng thái auth toàn cục để các module khác có thể dùng
export const authState = {
  firebaseUser: null,
  profile: null,
  loading: true,
};

// Đăng nhập với Google
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    // Đảm bảo có hồ sơ trong Firestore
    const profile = await ensureUserDocument(firebaseUser);

    authState.firebaseUser = firebaseUser;
    authState.profile = profile;
    authState.loading = false;

    return { firebaseUser, profile };
  } catch (err) {
    console.error("Lỗi đăng nhập:", err);
    throw err;
  }
}

// Đăng xuất
export async function logout() {
  try {
    await signOut(auth);
    authState.firebaseUser = null;
    authState.profile = null;
    authState.loading = false;
  } catch (err) {
    console.error("Lỗi đăng xuất:", err);
    throw err;
  }
}

// Lắng nghe thay đổi auth và load hồ sơ user
export function subscribeAuthState(callback) {
  // Một số file cũ có thể gọi subscribeAuthState()/initAuth() mà không truyền callback.
  // Tránh crash "callback is not a function".
  if (typeof callback !== "function") callback = () => {};

  authState.loading = true;

  return onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (!firebaseUser) {
        authState.firebaseUser = null;
        authState.profile = null;
        authState.loading = false;
        callback(null, null);
        return;
      }

      authState.firebaseUser = firebaseUser;

      // Lấy hồ sơ từ Firestore (đã có ensureUserDocument ở lần login đầu)
      let profile = await getUserDocument(firebaseUser.uid);
      if (!profile) {
        profile = await ensureUserDocument(firebaseUser);
      }

      authState.profile = profile;
      authState.loading = false;

      callback(firebaseUser, profile);
    } catch (err) {
      console.error("Lỗi khi xử lý onAuthStateChanged:", err);
      authState.loading = false;
      callback(firebaseUser || null, authState.profile || null);
    }
  });
}

// Backward-compatible alias: các file cũ dùng initAuth(callback)
export function initAuth(callback) {
  return subscribeAuthState(callback);
}
