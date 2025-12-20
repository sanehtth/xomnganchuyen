const unsub = auth.onAuthStateChanged(async (u) => {
  setUser(u);
  const admin = u ? ADMIN_EMAILS.includes(u.email) : false;
  setIsAdmin(admin);

  if (u) {
    const dbUser = await ensureUserRecord(u, admin);

    setMemberStatus(dbUser?.status ?? "guest");
    setRole(dbUser?.role ?? "guest");
  }

  setLoading(false);
});
``` :contentReference[oaicite:0]{index=0}  

Vậy: **mỗi lần login, luôn gọi `ensureUserRecord`**.  
Chỉ cần `ensureUserRecord` lỡ tay `set()` lại record là bạn mất sạch role/ID.

Giờ mình làm một bản cực “an toàn”:  
- **Login lần đầu**: tạo record user (guest, chưa gửi yêu cầu).  
- **Từ lần thứ 2 trở đi**: `ensureUserRecord` **không chỉnh sửa DB nữa**, chỉ đọc và trả về.  
→ Như vậy, kể cả có bug ở chỗ khác, login sẽ không bao giờ reset role/status/joinCode nữa.

---

## 1. Thay toàn bộ `src/services/userService.js` bằng code này

```js
// src/services/userService.js
import { ref, get, set, update } from "firebase/database";
import { db } from "../firebase";

/**
 * Đảm bảo user có record trong Realtime Database.
 *
 * QUY TẮC:
 * - Nếu user CHƯA tồn tại:
 *    -> tạo mới với role = "guest", status = "none" (chưa gửi yêu cầu)
 * - Nếu user ĐÃ tồn tại:
 *    -> KHÔNG ghi đè role / status / joinCode / level / coin / xp
 *    -> CHỈ đọc và trả về dữ liệu hiện có (cộng thêm email/name/avatar mới nếu cần)
 */
export async function ensureUserRecord(firebaseUser, isAdmin = false) {
  if (!firebaseUser) return null;

  const uid = firebaseUser.uid;
  const userRef = ref(db, `users/${uid}`);

  // Thông tin cơ bản từ Firebase Auth
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
    // Không ghi gì nếu đọc lỗi để tránh reset dữ liệu
    return baseProfile;
  }

  // 1) User CHƯA tồn tại -> tạo mới
  if (!snap.exists()) {
    const now = Date.now();

    const newUser = {
      ...baseProfile,
      createdAt: now,
      lastActiveAt: now,
      role: "guest",     // tất cả user mới đều là guest
      status: "none",    // chưa gửi yêu cầu VIP
      level: 0,
      xp: 0,
      coin: 0,
      joinCode: "",      // admin sẽ tạo nếu duyệt VIP
    };

    await set(userRef, newUser);
    return newUser;
  }

  // 2) User ĐÃ tồn tại -> KHÔNG động vào role/status/joinCode
  const current = snap.val() || {};

  // chỉ cập nhật thông tin cơ bản + lastActiveAt NẾU thấy cần
  const now = Date.now();

  const updates = {};
  let needUpdate = false;

  if (current.email !== baseProfile.email) {
    updates.email = baseProfile.email;
    needUpdate = true;
  }
  if (current.displayName !== baseProfile.displayName) {
    updates.displayName = baseProfile.displayName;
    needUpdate = true;
  }
  if (current.photoURL !== baseProfile.photoURL) {
    updates.photoURL = baseProfile.photoURL;
    needUpdate = true;
  }

  // luôn cập nhật lastActiveAt
  updates.lastActiveAt = now;
  needUpdate = true;

  if (needUpdate) {
    await update(userRef, updates);
  }

  // trả về dữ liệu đã merge, NHƯNG role/status/joinCode... vẫn là từ current
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
