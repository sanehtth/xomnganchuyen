// src/firebase.js
// Khởi tạo Firebase + hàm tiện ích cho Auth & Realtime Database (users)

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

// Dùng biến môi trường Vite (em đã có trong .env)
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
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getDatabase(app);

const USERS_PATH = "/users";

// Tạo / cập nhật hồ sơ user tối thiểu trong Realtime DB
export async function ensureUserProfile(firebaseUser) {
  const uid = firebaseUser.uid;
  const userRef = ref(db, `${USERS_PATH}/${uid}`);

  const snap = await get(userRef);
  if (snap.exists()) {
    await update(userRef, { lastActiveAt: Date.now() });
    return snap.val();
  }

  const newProfile = {
    uid,
    displayName: firebaseUser.displayName || firebaseUser.email || "User",
    email: firebaseUser.email || "",
    photoUrl: firebaseUser.photoURL || "",
    xp: 0,
    coin: 0,
    level: 1,
    traits: {
      competitiveness: 0,
      creativity: 0,
      perfectionism: 0,
      playfulness: 0,
      self_improvement: 0,
      sociability: 0,
    },
    role: "guest",   // guest | member | associate | admin
    status: "none",  // none | pending | approved | rejected
    joinCode: "",
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };

  await set(userRef, newProfile);
  return newProfile;
}

// Lắng nghe realtime hồ sơ của 1 user
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

// User gửi yêu cầu lên member / VIP
export async function requestVip(uid) {
  const userRef = ref(db, `${USERS_PATH}/${uid}`);
  await update(userRef, {
    status: "pending",
  });
}

// Admin: lấy toàn bộ users
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
    if (joinCode) patch.joinCode = joinCode;
  }

  await update(ref(db, `${USERS_PATH}/${uid}`), patch);
}

// Admin: set role trực tiếp
export async function setUserRole(uid, role) {
  await update(ref(db, `${USERS_PATH}/${uid}`), { role });
}

// ---- Hàm auth tiện ích ----

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const firebaseUser = result.user;
  await ensureUserProfile(firebaseUser);
  return firebaseUser;
}

export async function logout() {
  await signOut(auth);
}

// Export cho các file khác dùng
export { app, auth, googleProvider, db, onAuthStateChanged };
