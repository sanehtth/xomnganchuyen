// src/services/userService.js
import { ref, get, set, update } from "firebase/database";
import { db } from "../firebase";

/**
 * Đảm bảo user có record trong Realtime Database.
 * - Nếu user CHƯA tồn tại: tạo mới với role = guest, status = pending.
 * - Nếu user ĐÃ tồn tại: chỉ cập nhật thông tin cơ bản (email, name, avatar, lastActive),
 *   KHÔNG ghi đè role / status / joinCode / level / coin / xp.
 */
export async function ensureUserRecord(firebaseUser, isAdmin = false) {
  if (!firebaseUser) return null;

  const uid = firebaseUser.uid;
  const userRef = ref(db, `users/${uid}`);

  const snap = await get(userRef);

  // Dữ liệu cơ bản lấy từ Firebase Auth
  const baseProfile = {
    uid,
    email: firebaseUser.email || "",
    displayName:
      firebaseUser.displayName ||
      (firebaseUser.email ? firebaseUser.email.split("@")[0] : "No name"),
    photoURL: firebaseUser.photoURL || "",
  };

  // Nếu user chưa có trong DB → tạo mới
  if (!snap.exists()) {
    const now = Date.now();

    const newUser = {
      ...baseProfile,
      createdAt: now,
      lastActiveAt: now,

      // mặc định cho user mới
      role: "guest",
      status: "pending",
      level: 0,
      xp: 0,
      coin: 0,
      joinCode: "", // sẽ được admin tạo sau
    };

    await set(userRef, newUser);
    return newUser;
  }

  // Nếu user đã tồn tại → chỉ update thông tin cơ bản + lastActiveAt
  const current = snap.val() || {};
  const now = Date.now();

  const updates = {
    ...baseProfile,
    lastActiveAt: now,
  };

  await update(userRef, updates);

  // Trả về bản đã merge: ưu tiên data cũ (role, status, joinCode, ...)
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
