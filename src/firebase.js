// src/firebase.js
// Khởi tạo Firebase + các hàm tiện ích cho Auth & Realtime Database (users)

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
  get,
  set,
  update,
  onValue,
} from "firebase/database";

// =======================
// CẤU HÌNH FIREBASE
// =======================
// (giữ đúng như project hiện tại của bạn)
const firebaseConfig = {
  apiKey: "AIzaSyCsy8_u9ELGMiur-YyKsDYu1oU8YSpZKXY",
  authDomain: "xomnganchuyen.firebaseapp.com",
  projectId: "xomnganchuyen",
  storageBucket: "xomnganchuyen.firebasestorage.app",
  messagingSenderId: "335661705640",
  appId: "1:335661705640:web:8bde062fae1fcb3c99559d",
  measurementId: "G-21JSZ5G1EX",
};

// Khởi tạo app + service
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getDatabase(app);

// Path cố định cho bảng user trong Realtime DB
// = /users/{uid}
const USERS_PATH = "/users";

// =======================
// 1. HỒ SƠ USER TRONG REALTIME DB
// =======================
//
// CẤU TRÚC CHUẨN (theo đúng bảng bạn đang có):
//
// /users/{uid} = {
//   uid: string,
//   displayName: string,
//   email: string,
//   photoURL: string,
//   xp: number,
//   coin: number,
//   level: number,
//   role: "guest" | "member" | "associate" | "admin",
//   status: "none" | "pending" | "approved" | "rejected",
//   joinCode: string,
//   createdAt: number (timestamp ms),
//   lastActiveAt: number (timestamp ms),
// }
//
// Lưu ý:
// - Realtime DB chỉ giữ hồ sơ cơ bản + 3 chỉ số công khai.
// - Các trait/metrics nâng cao để bên Firestore (firestoreUserService).

// Tạo / cập nhật hồ sơ user tối thiểu trong Realtime DB
export async function ensureUserProfile(firebaseUser) {
  if (!firebaseUser) return null;

  const uid = firebaseUser.uid;
  const userRef = ref(db, `${USERS_PATH}/${uid}`);
  const snap = await get(userRef);

  const baseFields = {
    uid,
    displayName: firebaseUser.displayName || firebaseUser.email || "User",
    email: firebaseUser.email || "",
    photoURL: firebaseUser.photoURL || "",
  };

  const now = Date.now();

  if (snap.exists()) {
    // Đã có user -> chỉ update thông tin cơ bản + lastActive,
    // KHÔNG đụng tới role/status/joinCode hiện tại.
    const current = snap.val() || {};

    const patch = {
      ...baseFields,
      lastActiveAt: now,
    };

    // Nếu xp/coin/level chưa có hoặc sai kiểu thì set mặc định
    if (typeof current.xp !== "number") patch.xp = 0;
    if (typeof current.coin !== "number") patch.coin = 0;
    if (typeof current.level !== "number") patch.level = 1;

    await update(userRef, patch);
    return { ...current, ...patch };
  }

  // User mới đăng nhập lần đầu
  const newProfile = {
    ...baseFields,
    xp: 0,
    coin: 0,
    level: 1,
    role: "guest",   // guest mặc định
    status: "none",  // chưa gửi yêu cầu
    joinCode: "",
    createdAt: now,
    lastActiveAt: now,
  };

  await set(userRef, newProfile);
  return newProfile;
}

// Lắng nghe realtime hồ sơ 1 user
export function subscribeToUserProfile(uid, callback) {
  const userRef = ref(db, `${USERS_PATH}/${uid}`);
  return onValue(userRef, (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
}

// Đọc profile 1 lần
export async function fetchUserProfile(uid) {
  const userRef = ref(db, `${USERS_PATH}/${uid}`);
  const snap = await get(userRef);
  return snap.exists() ? snap.val() : null;
}

// User gửi yêu cầu trở thành member / VIP
export async function requestVip(uid) {
  const userRef = ref(db, `${USERS_PATH}/${uid}`);
  await update(userRef, {
    status: "pending",
  });
}

// Admin: lấy toàn bộ users trong Realtime DB
export async function fetchAllUsers() {
  const snap = await get(ref(db, USERS_PATH));
  if (!snap.exists()) return [];
  const raw = snap.val();

  return Object.keys(raw).map((uid) => ({
    uid,
    ...raw[uid],
  }));
}

// Admin: duyệt / từ chối user
export async function approveUser(uid, approved, joinCode = "") {
  const status = approved ? "approved" : "rejected";
  const patch = { status };

  if (approved) {
    patch.role = "member";
    if (joinCode) {
      patch.joinCode = joinCode;
    }
  }

  await update(ref(db, `${USERS_PATH}/${uid}`), patch);
}

// Admin: chỉnh role trực tiếp (ví dụ: set thành admin / associate)
export async function setUserRole(uid, role) {
  await update(ref(db, `${USERS_PATH}/${uid}`), { role });
}

// =======================
// 2. HÀM AUTH TIỆN ÍCH
// =======================

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const firebaseUser = result.user;

  // Đảm bảo có record trong Realtime DB
  await ensureUserProfile(firebaseUser);

  return firebaseUser;
}

export async function logout() {
  await signOut(auth);
}

// Export cho các file khác dùng
export {
  app,
  auth,
  googleProvider,
  db,
  onAuthStateChanged,
  USERS_PATH,
};
