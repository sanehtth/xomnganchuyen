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

// =======================
// Admin helper: tao joinCode neu bi thieu
// - joinCode duoc su dung khi user len member
// - Neu user da co joinCode: bo qua
// - Neu chua co joinCode:
//    + neu da co "id" (XNC...): dung id lam joinCode
//    + neu chua co id: tao moi id bang generateXncId() va dung luon cho joinCode
// Tra ve: { updated: number }
// =======================
export async function ensureJoinCodes(uids = []) {
  let updated = 0;
  for (const uid of uids) {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) continue;
      const data = snap.data() || {};
      const currentJoin = (data.joinCode || "").toString().trim();
      if (currentJoin) continue;

      const currentId = (data.id || "").toString().trim();
      const newId = currentId || generateXncId();
      const patch = {
        joinCode: newId,
      };
      if (!currentId) patch.id = newId;
      await updateDoc(userRef, patch);
      updated += 1;
    } catch (e) {
      // bo qua tung user de khong lam fail ca lo
      console.warn("ensureJoinCodes failed for", uid, e);
    }
  }
  return { updated };
}
