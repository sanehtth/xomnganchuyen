// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCsy8_u9ELGMiur-YyKsDYu1oU8YSpZKXY",
  authDomain: "xomnganchuyen.firebaseapp.com",
  databaseURL:
    "https://xomnganchuyen-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "xomnganchuyen",
  storageBucket: "xomnganchuyen.firebasestorage.app",
  messagingSenderId: "335661705640",
  appId: "1:335661705640:web:8bde062fae1fcb3c99559d",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);

// Lắng nghe user trong Realtime Database
export function listenUser(uid, cb) {
  const userRef = ref(db, `users/${uid}`);
  return onValue(userRef, (snap) => cb(snap.val()));
}

// Tạo / cập nhật hồ sơ user
export function ensureUserProfile(user) {
  const userRef = ref(db, `users/${user.uid}`);

  const payload = {
    uid: user.uid,
    displayName: user.displayName ?? "",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    xp: 0,
    level: 1,
    coin: 0,
    role: "guest",
    status: "pending",
  };

  return set(userRef, payload);
}

// ========= HÀM ĐANG GÂY LỖI NẾU KHÔNG EXPORT =========
export async function LoginWithGooglePopup() {
  const res = await signInWithPopup(auth, googleProvider);
  const user = res.user;
  await ensureUserProfile(user);
  return user;
}

// Giữ lại tên cũ cho các file khác (nếu có)
export async function loginWithGoogle() {
  return LoginWithGooglePopup();
}

// Logout
export function logout() {
  return signOut(auth);
}
