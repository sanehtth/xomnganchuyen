// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

// CẤU HÌNH FIREBASE CỦA BẠN
const firebaseConfig = {
  apiKey: "AIzaSyCsy8_u9ELGMiur-YyKsDYu1oU8YSpZKXY",
  authDomain: "xomnganchuyen.firebaseapp.com",
  projectId: "xomnganchuyen",
  storageBucket: "xomnganchuyen.firebasestorage.app",
  messagingSenderId: "335661705640",
  appId: "1:335661705640:web:8bde062fae1fcb3c99559d",
  measurementId: "G-21JSZ5G1EX",
};

// KHỞI TẠO
const app = initializeApp(firebaseConfig);

// Auth + Firestore
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const firestore = getFirestore(app);

// DANH SÁCH ADMIN (email) – sửa theo ý bạn
const ADMIN_EMAILS = ["sane.htth@gmail.com"];

// MẶC ĐỊNH stats / traits / metrics
function defaultStats() {
  return { coin: 0, xp: 0, level: 1 };
}

function defaultTraits() {
  return {
    competitiveness: 0,
    creativity: 0,
    perfectionism: 0,
    playfulness: 0,
    self_improvement: 0,
    sociability: 0,
  };
}

function defaultMetrics() {
  return { fi: 0, pi: 0, pi_star: 0 };
}

// TÍNH LEVEL TỪ XP (bạn muốn chỉnh logic thì đổi ở đây)
export function calculateLevelFromXp(totalXp) {
  const base = Math.floor((totalXp || 0) / 100) + 1;
  return base < 1 ? 1 : base;
}

// TẠO USER DOC CƠ BẢN TỪ FirebaseUser
function buildBaseUserDoc(firebaseUser) {
  const email = firebaseUser.email || "";
  const displayName =
    firebaseUser.displayName ||
    (email ? email.split("@")[0] : "No name");

  const now = Date.now();

  return {
    uid: firebaseUser.uid,
    email,
    displayName,
    photoURL: firebaseUser.photoURL || "",
    createdAt: now,
    lastActiveAt: now,

    // Mặc định cho user mới
    role: ADMIN_EMAILS.includes(email) ? "admin" : "guest",
    status: ADMIN_EMAILS.includes(email) ? "approved" : "none", // none = chưa gửi yêu cầu
    joinCode: "",

    stats: defaultStats(),
    traits: defaultTraits(),
    metrics: defaultMetrics(),

    flags: {
      quizDone: false,
      quizEng: false,
    },
  };
}

/**
 * Đảm bảo user có document trong Firestore:
 * - Nếu CHƯA có: tạo mới với dữ liệu mặc định.
 * - Nếu ĐÃ có: chỉ update email, displayName, photoURL, lastActiveAt.
 *   KHÔNG ghi đè role / status / joinCode / stats / traits / metrics.
 */
export async function ensureUserDoc(firebaseUser) {
  if (!firebaseUser) return null;

  const uid = firebaseUser.uid;
  const userRef = doc(firestore, "users", uid);
  const snap = await getDoc(userRef);

  const baseDoc = buildBaseUserDoc(firebaseUser);

  if (!snap.exists()) {
    await setDoc(userRef, baseDoc);
    return baseDoc;
  }

  const current = snap.data() || {};
  const updatePayload = {
    email: baseDoc.email,
    displayName: baseDoc.displayName,
    photoURL: baseDoc.photoURL,
    lastActiveAt: Date.now(),
  };

  await updateDoc(userRef, updatePayload);

  return {
    ...current,
    ...updatePayload,
  };
}

// ĐĂNG NHẬP GOOGLE
export async function loginWithGoogle() {
  const res = await signInWithPopup(auth, googleProvider);
  const user = res.user;
  await ensureUserDoc(user);
  return user;
}

// ĐĂNG XUẤT
export async function logout() {
  await signOut(auth);
}
