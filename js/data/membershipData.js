// js/data/membershipData.js
// Cac ham lien quan den viec xin thanh vien, duyet, tu choi

import { db, doc, updateDoc } from "../he-thong/firebase.js";

export async function requestMembership(uid) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    status: "pending",
  });
}

export async function approveMembership(uid, newRole = "member", joinCode = "") {
  const userRef = doc(db, "users", uid);
  const patch = {
    status: "approved",
    role: newRole,
  };
  if (joinCode) {
    patch.joinCode = joinCode;
  }
  await updateDoc(userRef, patch);
}

export async function rejectMembership(uid) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    status: "rejected",
  });
}
