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
  onValue,
  set,
  get,
  update,
} from "firebase/database";

// TODO: thay toàn bộ object này bằng config thật của em
// copy từ file cũ hoặc từ Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyCsy8_u9ELGMiur-YyKsDYu1oU8YSpZKXY",
  authDomain: "xomnganchuyen.firebaseapp.com",
  projectId: "xomnganchuyen",
  storageBucket: "xomnganchuyen.firebasestorage.app",
  messagingSenderId: "335661705640",
  appId: "1:335661705640:web:8bde062fae1fcb3c99559d",
  measurementId: "G-21JSZ5G1EX",
};

const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Realtime Database (đang dùng cho user hiện tại)
export const db = getDatabase(app);

// Lắng nghe user trong Realtime Database
export function listenUser(uid, cb) {
  const userRef = ref(db, `users/${uid}`);
  return onValue(userRef, (snap) => {
    cb(snap.val() || null);
  });
}

// Tạo / cập nhật hồ sơ user trong Realtime DB
export async function ensureUserProfile(user) {
  if (!user) return null;

  const userRef = ref(db, `users/${user.uid}`);
  const snap = await get(userRef);

  if (!snap.exists()) {
    const payload = {
      uid: user.uid,
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? "",
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      level: 1,
      coin: 0,
      xp: 0,
      joinCode: "",
      role: "guest",      // guest mặc định
      status: "pending",  // chờ duyệt VIP
    };

    await set(userRef, payload);
    return payload;
  }

  const existing = snap.val();

  const updated = {
    ...existing,
    // chỉ update lastActiveAt khi login, KHÔNG đụng tới role/status/joinCode
    lastActiveAt: Date.now(),
  };

  await update(userRef, { lastActiveAt: updated.lastActiveAt });

  return updated;
}

// Đăng nhập Google, tự tạo hồ sơ user nếu chưa có
export async function loginWithGoogle() {
  const res = await signInWithPopup(auth, googleProvider);
  const user = res.user;

  const userRecord = await ensureUserProfile(user);

  return { user, userRecord };
}

// Đăng xuất
export async function logout() {
  await signOut(auth);
}
