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
  getUserDocument, // CHỈ ĐỌC
} from "../data/userData.js";
import { ensureRealtimeUser } from "../data/realtimeUser.js"; // HÀM TẠO USER REALTIME (đã có / hoặc bạn sẽ có)

// Trạng thái auth toàn cục
export const authState = {
  firebaseUser: null,
  profile: null, // chỉ là Firestore profile (nếu có)
  loading: true,
};

// =========================
// ĐĂNG NHẬP GOOGLE
// =========================
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    // 1️⃣ CHỈ TẠO REALTIME USER (guest)
    await ensureRealtimeUser(firebaseUser);

    // 2️⃣ CHỈ ĐỌC Firestore (nếu đã là member)
    const profile = await getUserDocument(firebaseUser.uid);

    authState.firebaseUser = firebaseUser;
    authState.profile = profile; // null nếu chưa được duyệt
    authState.loading = false;

    return { firebaseUser, profile };
  } catch (err) {
    console.error("Lỗi đăng nhập:", err);
    throw err;
  }
}

// =========================
// ĐĂNG XUẤT
// =========================
export async function logout() {
  await signOut(auth);
  authState.firebaseUser = null;
  authState.profile = null;
  authState.loading = false;
}

// =========================
// LẮNG NGHE AUTH
// =========================
export function subscribeAuthState(callback) {
  authState.loading = true;

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      authState.firebaseUser = null;
      authState.profile = null;
      authState.loading = false;
      callback(null, null);
      return;
    }

    authState.firebaseUser = firebaseUser;

    // ❌ TUYỆT ĐỐI KHÔNG ensureUserDocument Ở ĐÂY
    const profile = await getUserDocument(firebaseUser.uid);

    authState.profile = profile; // null = guest
    authState.loading = false;

    callback(firebaseUser, profile);
  });
}
