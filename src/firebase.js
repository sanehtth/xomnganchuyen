// src/firebase.js
// ================== KHỞI TẠO FIREBASE ==================
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

// TODO: thay các giá trị này bằng config THẬT của project bạn
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

// Auth + Realtime DB
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);

// ================== HÀM LẮNG NGHE USER (Dashboard) ==================
export function listenUser(uid, cb) {
  if (!uid) return () => {};

  const userRef = ref(db, `users/${uid}`);
  const unsubscribe = onValue(userRef, (snap) => {
    cb(snap.val() || null);
  });

  // Trả về hàm để component có thể hủy đăng ký nếu cần
  return unsubscribe;
}

// ================== TẠO / CẬP NHẬT HỒ SƠ USER ==================
export async function ensureUserProfile(user) {
  if (!user) return null;

  const userRef = ref(db, `users/${user.uid}`);
  const snap = await get(userRef);

  // Nếu đã có user trong DB -> chỉ cập nhật thời gian hoạt động cuối
  if (snap.exists()) {
    const existing = snap.val();
    const updateData = {
      lastActiveAt: Date.now(),
      // cập nhật lại tên / avatar nếu user đổi trên Google
      displayName: user.displayName || existing.displayName || "",
      photoURL: user.photoURL || existing.photoURL || "",
    };
    await update(userRef, updateData);
    return { ...existing, ...updateData };
  }

  // Nếu chưa có -> tạo bản ghi mới
  const payload = {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
    createdAt: Date.now(),
    lastActiveAt: Date.now(),

    // 3 chỉ số cho người dùng thấy
    xp: 0,
    coin: 0,
    level: 1,

    // các trường dành cho bạn quản lý
    role: "guest",        // guest | member | associate | admin
    status: "none",       // none | pending | approved | rejected
    joinCode: "",         // sẽ gán khi user gửi yêu cầu VIP / được duyệt
  };

  await set(userRef, payload);
  return payload;
}

// ================== LOGIN / LOGOUT ==================
export async function loginWithGoogle() {
  const res = await signInWithPopup(auth, googleProvider);
  const user = res.user;
  // đảm bảo có record trong Realtime DB
  await ensureUserProfile(user);
  return user;
}

export function logout() {
  return signOut(auth);
}

// Cho AuthContext dùng nếu cần
export function listenAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ================== JOIN GATE: GỬI YÊU CẦU VIP ==================
export async function requestVip(uid) {
  const userRef = ref(db, `users/${uid}`);
  const snap = await get(userRef);
  if (!snap.exists()) {
    throw new Error("User not found");
  }

  const current = snap.val();

  // Nếu đã là member/associate/admin thì không cần gửi nữa
  if (current.role !== "guest") {
    return current;
  }

  // Tạo mã joinCode 8 ký tự
  const joinCode = Math.random().toString(36).slice(2, 10).toUpperCase();

  const updateData = {
    joinCode,
    status: "pending", // chờ admin duyệt
    lastActiveAt: Date.now(),
  };

  await update(userRef, updateData);
  return { ...current, ...updateData };
}

// ================== ADMIN: LẤY DANH SÁCH USER ==================
export async function fetchAllUsers() {
  const usersRef = ref(db, "users");
  const snap = await get(usersRef);

  if (!snap.exists()) return [];

  const data = snap.val();
  // Trả về mảng cho dễ map trong AdminUsers.jsx
  return Object.entries(data).map(([uid, user]) => ({
    uid,
    ...user,
  }));
}

// ================== ADMIN: DUYỆT USER LÊN MEMBER ==================
export async function approveUser(uid) {
  const userRef = ref(db, `users/${uid}`);
  const snap = await get(userRef);
  if (!snap.exists()) {
    throw new Error("User not found");
  }

  const current = snap.val();

  // Nếu chưa có joinCode thì tạo mới
  const joinCode =
    current.joinCode && current.joinCode !== ""
      ? current.joinCode
      : Math.random().toString(36).slice(2, 10).toUpperCase();

  const updateData = {
    role: "member",
    status: "approved",
    joinCode,
    lastActiveAt: Date.now(),
  };

  await update(userRef, updateData);
  return { ...current, ...updateData };
}

// ================== ADMIN: ĐỔI ROLE (guest / member / associate / admin) ==================
export async function setUserRole(uid, role) {
  const userRef = ref(db, `users/${uid}`);
  await update(userRef, { role });
}
