// js/data/membershipData.js
// Cac chuc nang lien quan toi membership (yeu cau member, duyet user, set role)

import {
  db,
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
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
    // lay thong tin user hien tai de kiem tra joinCode
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : {};

    const patch = {
      status: "approved",
    };

    if (newRole) {
      patch.role = newRole;
    }

    // Neu user chua co joinCode -> sinh moi
    if (!data.joinCode || String(data.joinCode).trim() === "") {
      patch.joinCode = generateXncId();
    }

    await updateDoc(userRef, patch);
    return;
  }

  if (action === "reject") {
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
