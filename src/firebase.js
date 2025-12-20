// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  onValue,
  set,
  get,
  update,
} from "firebase/database";

// TODO: THAY BẰNG CONFIG THẬT CỦA EM
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

// ---------- AUTH ----------
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ---------- REALTIME DB ----------
export const db = getDatabase(app);

// Lắng nghe thay đổi dữ liệu user trong Realtime DB
export function listenUser(uid, cb) {
  if (!uid) return () => {};
  const userRef = ref(db, `users/${uid}`);
  return onValue(userRef, (snap) => {
    cb(snap.val() || null);
  });
}

// Helper tạo mã joinCode ngẫu nhiên
function generateJoinCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// Tạo / cập nhật hồ sơ user trong Realtime DB
// LƯU Ý: status mặc định là "none" (chưa gửi yêu cầu VIP)
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
      role: "guest",   // khách
      status: "none",  // chưa gửi yêu cầu VIP
    };

    await set(userRef, payload);
    return payload;
  }

  const existing = snap.val();
  const lastActiveAt = Date.now();

  await update(userRef, { lastActiveAt });

  return {
    ...existing,
    lastActiveAt,
  };
}

// Đăng nhập Google + đảm bảo hồ sơ user tồn tại
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

// HÀM EM ĐANG IMPORT Ở JoinGate.jsx
// -> khi user bấm "Gửi yêu cầu VIP"
export async function requestVip(uid) {
  if (!uid) throw new Error("Missing uid");

  const userRef = ref(db, `users/${uid}`);
  const snap = await get(userRef);

  if (!snap.exists()) {
    throw new Error("User not found in database");
  }

  const user = snap.val();

  // Nếu chưa có joinCode thì tạo mới, nếu có rồi thì giữ nguyên
  const joinCode = user.joinCode && user.joinCode.trim()
    ? user.joinCode
    : generateJoinCode(8);

  const updates = {
    status: "pending", // gửi yêu cầu VIP -> chờ duyệt
    joinCode,
  };

  await update(userRef, updates);

  return { ...user, ...updates };
}
