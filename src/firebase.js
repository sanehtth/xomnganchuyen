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
  set,
  get,
  update,
  onValue,
} from "firebase/database";

// ==== THÊM FIRESTORE VÀO ĐÂY ====
import { getFirestore } from "firebase/firestore";

// ===== CẤU HÌNH FIREBASE CỦA BẠN =====
const firebaseConfig = {
  apiKey: "AIzaSyCsy8_u9ELGMiur-YyKsDYu1oU8YSpZKXY",
  authDomain: "xomnganchuyen.firebaseapp.com",
  databaseURL: "https://xomnganchuyen-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "xomnganchuyen",
  storageBucket: "xomnganchuyen.firebasestorage.app",
  messagingSenderId: "335661705640",
  appId: "1:335661705640:web:8bde062fae1fcb3c99559d",
};
// =====================================

// Khởi tạo app
const app = initializeApp(firebaseConfig);

// Auth & DB
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);

// ==== THÊM DÒNG NÀY ====
// Firestore dùng để quản lý user, trait, metrics, weekly...
export const firestore = getFirestore(app);


// Lắng nghe realtime 1 user theo uid (nếu sau này cần)
export function listenUser(uid, cb) {
  const userRef = ref(db, `users/${uid}`);
  return onValue(userRef, (snap) => cb(snap.val()));
}

/**
 * Đảm bảo user có record trong Realtime Database.
 * - Nếu user CHƯA tồn tại: tạo mới với role = "guest", status = "none"
 * - Nếu user ĐÃ tồn tại: chỉ update thông tin cơ bản + lastActiveAt,
 *   KHÔNG đụng vào role/status/joinCode/level/coin/xp.
 */
export async function ensureUserProfile(user) {
  if (!user) return null;

  const userRef = ref(db, `users/${user.uid}`);
  const snap = await get(userRef);

  const baseProfile = {
    uid: user.uid,
    email: user.email || "",
    displayName:
      user.displayName ||
      (user.email ? user.email.split("@")[0] : "No name"),
    photoURL: user.photoURL || "",
  };

  const now = Date.now();

  // User mới
  if (!snap.exists()) {
    const payload = {
      ...baseProfile,
      createdAt: now,
      lastActiveAt: now,
      role: "guest",   // cấp bậc: guest / member / associate
      status: "none",  // trạng thái yêu cầu VIP: none / pending / approved
      level: 1,
      xp: 0,
      coin: 0,
      joinCode: "",
    };

    await set(userRef, payload);
    return payload;
  }

  // User đã tồn tại -> không ghi đè quyền
  const current = snap.val() || {};

  const payload = {
    ...baseProfile,
    lastActiveAt: now,
  };

  await update(userRef, payload);

  return {
    ...current,
    ...payload,
  };
}

// Đăng nhập bằng Google
export async function loginWithGoogle() {
  const res = await signInWithPopup(auth, googleProvider);
  const user = res.user;

  // tạo / cập nhật record trong DB nhưng không reset role/status
  await ensureUserProfile(user);

  return user;
}

// Đăng xuất
export async function logout() {
  await signOut(auth);
}
