
// js/data/statsData.js
// Cac ham thong ke don gian du tren collection users
// Phuc vu Admin xem bao cao tong quan

import {
  db,
  collection,
  getDocs,
  query,
  orderBy,
} from "../he-thong/firebase.js";

export async function fetchAllUsers() {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const users = [];
  snap.forEach((docSnap) => {
    users.push({ uid: docSnap.id, ...docSnap.data() });
  });
  return users;
}

export function computeUserCounts(users) {
  // users: mang cac user object
  let total = users.length;
  let guest = 0;
  let pending = 0;
  let member = 0;
  let adminCount = 0;

  users.forEach((u) => {
    const role = u.role || "guest";
    const status = u.status || "none";

    if (role === "guest") guest++;
    if (status === "pending") pending++;
    if (role === "member" || role === "associate") member++;
    if (role === "admin") adminCount++;
  });

  return {
    total,
    guest,
    pending,
    member,
    admin: adminCount,
  };
}

// Backward-compatible helper (mot so ban cu import ensureRealtimeUser tu statsData.js)
export async function ensureRealtimeUser() {
  return true;
}

