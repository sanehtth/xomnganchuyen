// src/services/userService.js
import { ref, get, set, update } from "firebase/database";
import { db } from "../firebase";

/**
 * Đảm bảo user có record trong Realtime Database.
 * - Nếu user CHƯA tồn tại: tạo mới với thông tin cơ bản (KHÔNG set role/status/joinCode).
 * - Nếu user ĐÃ tồn tại: chỉ cập nhật thông tin cơ bản + lastActiveAt,
 *   KHÔNG ghi đè role / status / joinCode / level / coin / xp.
 */
export async function ensureUserRecord(firebaseUser, isAdmin = false) {
  if (!firebaseUser) return null;

  const uid = firebaseUser.uid;
  const userRef = ref(db, `users/${uid}`);

  // Thông tin cơ bản lấy từ Firebase Auth
  const baseProfile = {
    uid,
    email: firebaseUser.email || "",
    displayName:
      firebaseUser.displayName ||
      (firebaseUser.email ? firebaseUser.email.split("@")[0] : "No name"),
    photoURL: firebaseUser.photoURL || "",
  };

  let snap;
  try {
    snap = await get(userRef);
  } catch (err) {
    console.error("Lỗi đọc user record:", err);
    // Nếu permission lỗi thì thôi, không ghi gì để tránh reset dữ liệu
    return baseProfile;
  }

  // User CHƯA tồn tại -> tạo mới với thông tin cơ bản
  if (!snap.exists()) {
    const now = Date.now();

    const newUser = {
      ...baseProfile,
      createdAt: now,
      lastActiveAt: now,
      // KHÔNG đặt role/status/joinCode ở đây
    };

    await set(userRef, newUser);
    return newUser;
  }

  // User ĐÃ tồn tại -> CHỈ update thông tin cơ bản + lastActiveAt
  const current = snap.val() || {};
  const now = Date.now();

  const updates = {
    ...baseProfile,
    lastActiveAt: now,
  };

  await update(userRef, updates);

  // Giữ nguyên role/status/joinCode/... từ current
  return {
    ...current,
    ...updates,
  };
}

/**
 * Hàm tiện ích nếu sau này bạn muốn cập nhật lastActive ở chỗ khác.
 */
export async function touchLastActive(uid) {
  if (!uid) return;
  const userRef = ref(db, `users/${uid}`);
  await update(userRef, { lastActiveAt: Date.now() });
}
