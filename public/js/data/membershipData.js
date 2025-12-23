// js/data/membershipData.js
// Cac chuc nang lien quan toi membership (yeu cau member, duyet user, set role)

import {
  db,
  collection,
  getDocs,
    getDoc,
  query,
  orderBy,
  doc,
  updateDoc,
} from "../he-thong/firebase.js";

import { generateXncId } from "./userData.js";

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
// truc tiep (neu can)
// =======================
export async function setUserRole(uid, newRole) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { role: newRole });
}
export async function approveUser(uid, action, newRole) {
  const userRef = doc(db, "users", uid);

  if (action === "approve") {
    // lấy hiện trạng để biết có joinCode chưa + có S_* chưa
    const snap = await getDoc(userRef);
    const cur = snap.exists() ? (snap.data() || {}) : {};

    const patch = {
      status: "approved",
    };

    if (newRole) patch.role = newRole;

    // sinh joinCode nếu thiếu
    if (!cur.joinCode) {
      patch.joinCode = generateXncId();
    }

    // backfill S_metrics nếu thiếu (để báo cáo ổn định)
    if (!cur.S_metrics) {
      patch.S_metrics = {
        S_xp: Number(cur.xp ?? 0),
        S_coin: Number(cur.coin ?? 0),
        S_level: Number(cur.level ?? 1),
      };
    }

    await updateDoc(userRef, patch);
    return true;
  }

  if (action === "reject") {
    await updateDoc(userRef, { status: "rejected" });
    return true;
  }

  return false;
}


// =======================
// Backfill joinCode cho cac user da duyet nhung chua co joinCode
// Chi cap nhat nhung user thieu joinCode
// =======================
export async function ensureJoinCodes(uids = []) {
  const updated = [];
  for (const uid of uids) {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) continue;
      const cur = snap.data() || {};
      if (cur.joinCode) continue;

      await updateDoc(userRef, { joinCode: generateXncId() });
      updated.push(uid);
    } catch (e) {
      console.error("ensureJoinCodes error:", uid, e);
    }
  }
  return updated;
}

