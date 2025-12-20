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

/**
 * Tạo / cập nhật hồ sơ user
 *
 * - Nếu user CHƯA có trong DB:
 *     tạo record mới với role = "guest", status = "none"
 * - Nếu user ĐÃ có:
 *     chỉ cập nhật thông tin cơ bản (email, displayName, photoURL, lastActiveAt)
 *     KHÔNG đụng vào role / status / joinCode / level / coin / xp
 */
export async function ensureUserProfile(user) {
  if (!user) return;

  const userRef = ref(db, `users/${user.uid}`);
  const snap = await get(userRef);

  const baseProfile = {
    uid: user.uid,
    displayName: user.displayName ?? "",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
  };

  // User chưa tồn tại -> tạo mới
  if (!snap.exists()) {
    const now = Date.now();

    const payload = {
      ...baseProfile,
      createdAt: now,
      lastActiveAt: now,
      role: "guest",   // tất cả user mới là guest
      status: "none",  // chưa gửi yêu cầu VIP
      level: 0,
      xp: 0,
      coin: 0,
      joinCode: "",    // admin sẽ tạo khi duyệt
    };

    await set(userRef, payload);
    return payload;
  }

  // User đã tồn tại -> chỉ update thông tin cơ bản
  const current = snap.val() || {};
  const now = Date.now();

  const updates = {};
  let needUpdate = false;

  if (current.displayName !== baseProfile.displayName) {
    updates.displayName = baseProfile.displayName;
    needUpdate = true;
  }
  if (current.email !== baseProfile.email) {
    updates.email = baseProfile.email;
    needUpdate = true;
  }
  if (current.photoURL !== baseProfile.photoURL) {
    updates.photoURL = baseProfile.photoURL;
    needUpdate = true;
  }

  updates.lastActiveAt = now;
  needUpdate = true;

  if (needUpdate) {
    await update(userRef, updates);
  }

  return { ...current, ...updates };
}

// Đăng nhập bằng Google
export async function loginWithGooglePopup() {
  const res = await signInWithPopup(auth, googleProvider);
  const user = res.user;
  // GỌI ensureUserProfile nhưng giờ đã an toàn, không reset role/status/joinCode
  await ensureUserProfile(user);
  return user;
}

// Đăng xuất
export async function logout() {
  await signOut(auth);
}
