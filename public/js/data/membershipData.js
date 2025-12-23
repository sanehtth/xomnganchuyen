// public/js/data/membershipData.js
// Xu ly nang cap membership (member/guest) va joinCode (Firestore)

import {
  db,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "../he-thong/firebase.js";

import { generateRefCode } from "./userData.js";

export async function setJoinCode(uid, joinCode) {
  if (!uid) throw new Error("uid is required");
  const code = String(joinCode || "").trim();
  if (!code) throw new Error("joinCode is required");

  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    joinCode: code,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Admin: duyet user => set role/status + tao joinCode neu chua co.
 *
 * - Neu user duoc set role = 'member' ma chua co joinCode => tao joinCode (format: XNC + 4 so).
 * - Luon luu id (ma 16 ky tu tu generateXncId) neu chua co.
 */
export async function approveUser(uid, updates = {}) {
  if (!uid) throw new Error("uid is required");

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() : {};

  const next = { ...updates };

  // Tao joinCode neu can
  const nextRole = (next.role ?? data.role ?? "guest").toLowerCase();
  if (nextRole === "member") {
    const existing = String(next.joinCode ?? data.joinCode ?? "").trim();
    if (!existing) {
      next.joinCode = generateRefCode("XNC");
    }
  }

  // Meta
  if (!data.createdAt) next.createdAt = serverTimestamp();
  next.updatedAt = serverTimestamp();

  await updateDoc(userRef, next);
}

/**
 * Admin: Dam bao danh sach user co joinCode (chi voi role member).
 * Dung khi admin bam nut "Duyet (approve) nhung user da check".
 */
export async function ensureJoinCodes(uids = []) {
  const list = Array.isArray(uids) ? uids.filter(Boolean) : [];
  if (list.length === 0) return { updated: 0 };

  const batch = writeBatch(db);
  let updated = 0;

  for (const uid of list) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) continue;
    const u = snap.data() || {};
    const role = String(u.role || "guest").toLowerCase();
    if (role !== "member") continue;
    const jc = String(u.joinCode || "").trim();
    if (jc) continue;

    batch.update(ref, {
      joinCode: generateRefCode("XNC"),
      updatedAt: serverTimestamp(),
    });
    updated++;
  }

  if (updated > 0) {
    await batch.commit();
  }

  return { updated };
}
