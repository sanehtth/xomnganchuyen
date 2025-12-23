// js/data/membershipData.js
// Cac chuc nang lien quan toi membership (yeu cau member, duyet user, set role)

import {
  db,
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
} from "../he-thong/firebase.js";

// =======================
// Lay danh sach user cho Admin Panel
// =======================
export async function fetchAllUsers() {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  const list = [];
  snap.forEach((d) => {
    list.push({
      uid: d.id,
      ...d.data(),
    });
  });

  return list;
}

// =======================
// UI gui yeu cau tro thanh member
// status trong DB: none | pending | approved | rejected | banned
// UI se map lai thanh normal / pending / banned
// =======================
export async function requestMembership(uid) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    status: "pending",
  });
}

// =======================
// Admin duyet / tu choi membership
// action: "approve" | "reject"
// newRole: "member" | "associate" | "admin" | "guest" ...
// =======================
export async function approveUser(uid, action, newRole) {
  const userRef = doc(db, "users", uid);

  if (action === "approve") {
    const patch = {
      status: "approved",
    };

    if (newRole) {
      patch.role = newRole;
    }

    await updateDoc(userRef, patch);
  } else if (action === "reject") {
    await updateDoc(userRef, {
      status: "rejected",
    });
  }
}

// =======================
// Admin set role truc tiep (neu can)
// =======================
export async function setUserRole(uid, newRole) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { role: newRole });
}

// Tạo/bổ sung joinCode cho các user (dùng cho Admin Panel)
// - uids: mảng uid cần xử lý
// - force: true -> ghi đè joinCode đã có
export async function ensureJoinCodes(uids = [], { force = false } = {}) {
  const result = { updated: 0, skipped: 0, errors: [] };
  if (!Array.isArray(uids) || uids.length === 0) return result;
  for (const uid of uids) {
    try {
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) { result.skipped++; continue; }
      const data = snap.data() || {};
      const current = (data.joinCode || "").trim();
      if (current && !force) { result.skipped++; continue; }
      const seed = (data.email || data.displayName || uid);
      const joinCode = generateRefCode(seed);
      await updateDoc(ref, { joinCode });
      result.updated++;
    } catch (e) {
      result.errors.push({ uid, message: e?.message || String(e) });
    }
  }
  return result;
}
