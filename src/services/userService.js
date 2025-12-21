import { database } from "../firebase";
import {
  ref as dbRef,
  get,
  update,
} from "firebase/database";

// Lấy toàn bộ list user cho trang admin
export async function fetchAllUsers() {
  const usersRef = dbRef(database, "users");
  const snap = await get(usersRef);

  if (!snap.exists()) return [];

  const data = snap.val();
  return Object.entries(data).map(([uid, value]) => ({
    uid,
    ...(value || {}),
  }));
}

// User gửi yêu cầu trở thành member
export async function requestVip(uid) {
  const userRef = dbRef(database, `users/${uid}`);
  const snap = await get(userRef);

  if (!snap.exists()) {
    throw new Error("Không tìm thấy user");
  }

  const current = snap.val() || {};

  // Nếu đã là member/associate/admin + status approved/admin rồi thì không gửi nữa
  const role = current.role || "guest";
  const status = current.status || "none";

  if (
    role !== "guest" &&
    (status === "approved" || status === "admin")
  ) {
    return current;
  }

  const joinCode =
    current.joinCode && current.joinCode !== ""
      ? current.joinCode
      : Math.random().toString(36).substring(2, 10).toUpperCase();

  const updated = {
    status: "pending",
    role, // vẫn giữ role hiện tại (thường là guest)
    joinCode,
  };

  await update(userRef, updated);

  return { ...current, ...updated };
}

// Duyệt user (admin dùng)
export async function approveUser(uid, newRole = "member") {
  const userRef = dbRef(database, `users/${uid}`);

  await update(userRef, {
    role: newRole,
    status: "approved",
  });
}

// Từ chối user (admin dùng)
export async function rejectUser(uid) {
  const userRef = dbRef(database, `users/${uid}`);

  await update(userRef, {
    status: "rejected",
  });
}

// Set role bất kỳ (ví dụ cộng sự, admin…)
export async function setUserRole(uid, role) {
  const userRef = dbRef(database, `users/${uid}`);

  await update(userRef, {
    role,
  });
}
