// src/firebase.js
// File này chỉ lo kết nối Firebase + mấy hàm helper dùng chung toàn app.

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

// TODO: điền config của bạn vào đây
const firebaseConfig = {
  apiKey: "AIzaSyCsy8_u9ELGMiur-YyKsDYu1oU8YSpZKXY",
  authDomain: "xomnganchuyen.firebaseapp.com",
  projectId: "xomnganchuyen",
  storageBucket: "xomnganchuyen.firebasestorage.app",
  messagingSenderId: "335661705640",
  appId: "1:335661705640:web:8bde062fae1fcb3c99559d",
  measurementId: "G-21JSZ5G1EX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Tạo user trong Firestore nếu chưa có.
 * Dùng khi user login lần đầu.
 */
export async function ensureUserProfile(firebaseUser) {
  if (!firebaseUser) return null;

  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const payload = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || "",
      email: firebaseUser.email || "",
      photoURL: firebaseUser.photoURL || "",
      role: "guest",           // mặc định mọi người là guest
      status: "none",          // chưa gửi yêu cầu VIP
      joinCode: "",

      coin: 0,
      xp: 0,
      level: 1,

      traits: {
        competitiveness: 0,
        creativity: 0,
        perfectionism: 0,
        playfulness: 0,
        selfImprovement: 0,
        sociability: 0,
      },

      weekly: {
        weekStart: null,
        xp: 0,
        coin: 0,
        activityScore: 0,
      },

      theme: "light",

      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    };

    await setDoc(ref, payload);
    return payload;
  } else {
    const data = snap.data();
    // cập nhật lastActiveAt mỗi lần load
    await updateDoc(ref, { lastActiveAt: serverTimestamp() });
    return { uid: firebaseUser.uid, ...data };
  }
}

/**
 * Đăng nhập bằng Google
 * Trả về { firebaseUser, profile }
 */
export async function loginWithGoogle() {
  const res = await signInWithPopup(auth, googleProvider);
  const firebaseUser = res.user;
  const profile = await ensureUserProfile(firebaseUser);
  return { firebaseUser, profile };
}

/**
 * Đăng xuất
 */
export function logoutFirebase() {
  return signOut(auth);
}

/**
 * Lấy toàn bộ user (dùng cho trang AdminUsers)
 */
export async function fetchAllUsers(limitNumber = 200) {
  const q = query(
    collection(db, "users"),
    orderBy("createdAt", "desc"),
    limit(limitNumber)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Approve user thành member + tạo joinCode
 */
export async function approveUser(uid, joinCode) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    role: "member",
    status: "approved",
    joinCode: joinCode,
  });
}

/**
 * Chuyển trạng thái user về pending (gửi yêu cầu VIP)
 */
export async function requestVip(uid, joinCode) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    status: "pending",
    joinCode: joinCode,
  });
}

/**
 * Set role bất kỳ cho user (admin sẽ dùng cái này)
 * role: "guest" | "member" | "contributor" | "admin"
 */
export async function setUserRole(uid, role) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { role });
}

/**
 * Đổi theme cho user và lưu Firestore
 */
export async function updateUserTheme(uid, theme) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { theme });
}

/**
 * Lắng nghe auth state (dùng trong AuthContext)
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
