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
  get,
  set,
  update,
  child,
} from "firebase/database";

// -------------------------
// Firebase config
// -------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCcvgddYQ0V9__pqkvNvxxw1VnyD6omNOQ",
  authDomain: "xomnganchuyen.firebaseapp.com",
  databaseURL:
    "https://xomnganchuyen-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "xomnganchuyen",
  storageBucket: "xomnganchuyen.appspot.com",
  messagingSenderId: "1050055484798",
  appId: "1:1050055484798:web:8e072df4fe8af0f173a941",
};

// -------------------------
// Init
// -------------------------
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);

// -------------------------
// Helpers
// -------------------------
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logout() {
  await signOut(auth);
}

/**
 * Tạo mã joinCode ngẫu nhiên cho VIP
 */
export function generateJoinCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/**
 * Giá trị mặc định cho 9 chỉ số hành vi + stats
 */
function defaultBehaviorProfile() {
  return {
    metrics: {
      fi: 0,
      pi: 0,
      pi_star: 0,
    },
    profile: {
      quizDone: false,
      quizEng: false,
      skills: "",
    },
    stats: {
      badge: 0,
      xp: 0,
      coin: 0,
    },
    traits: {
      competitiveness: 0,
      creativity: 0,
      perfectionism: 0,
      playfulness: 0,
      self_improvement: 0,
      sociability: 0,
    },
    weekly: {},
  };
}

/**
 * Đảm bảo user trong Realtime DB tồn tại.
 * - Nếu chưa có: tạo mới với role="guest", status="none"
 * - Nếu có rồi: update lại info cơ bản + lastActiveAt
 */
export async function ensureUserProfile(user) {
  if (!user) return null;

  const userRef = ref(db, `users/${user.uid}`);
  const snap = await get(userRef);

  if (snap.exists()) {
    const existing = snap.val();
    const updateData = {
      displayName: user.displayName || existing.displayName || "",
      email: user.email || existing.email || "",
      photoURL: user.photoURL || existing.photoURL || "",
      lastActiveAt: Date.now(),
    };
    await update(userRef, updateData);
    return { ...existing, ...updateData };
  }

  const base = {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
    createdAt: Date.now(),
    lastActiveAt: Date.now(),

    // quản lý & phân quyền
    role: "guest", // guest | member | associate | admin
    status: "none", // none | pending | approved | rejected
    joinCode: "",

    // chỉ số công khai
    xp: 0,
    coin: 0,
    level: 1,

    // bộ 9 chỉ số + weekly
    ...defaultBehaviorProfile(),
  };

  await set(userRef, base);
  return base;
}

/**
 * User gửi yêu cầu VIP:
 * - status -> "pending"
 * - tạo joinCode mới
 */
export async function requestVip(uid) {
  const userRef = ref(db, `users/${uid}`);
  const snap = await get(userRef);
  if (!snap.exists()) throw new Error("User not found");

  const current = snap.val();
  const newJoinCode = generateJoinCode();

  const updateData = {
    status: "pending",
    joinCode: newJoinCode,
    lastActiveAt: Date.now(),
  };

  await update(userRef, updateData);
  return { ...current, ...updateData };
}

/**
 * Lấy toàn bộ users (dùng cho Admin)
 */
export async function fetchAllUsers() {
  const rootRef = ref(db);
  const snap = await get(child(rootRef, "users"));
  if (!snap.exists()) return [];

  const obj = snap.val();
  return Object.keys(obj).map((uid) => ({
    uid,
    ...obj[uid],
  }));
}

/**
 * Admin duyệt user thành Member
 */
export async function approveUser(uid) {
  const userRef = ref(db, `users/${uid}`);
  const snap = await get(userRef);
  if (!snap.exists()) throw new Error("User not found");

  const current = snap.val();
  const joinCode = current.joinCode || generateJoinCode();

  const updateData = {
    role: "member",
    status: "approved",
    joinCode,
    lastActiveAt: Date.now(),
  };

  await update(userRef, updateData);
  return { ...current, ...updateData };
}

/**
 * Admin set role bất kỳ (guest/member/associate/admin)
 */
export async function setUserRole(uid, role) {
  const userRef = ref(db, `users/${uid}`);
  const snap = await get(userRef);
  if (!snap.exists()) throw new Error("User not found");

  const current = snap.val();
  const updateData = {
    role,
    lastActiveAt: Date.now(),
  };

  await update(userRef, updateData);
  return { ...current, ...updateData };
}
