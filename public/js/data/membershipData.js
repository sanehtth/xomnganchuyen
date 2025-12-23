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
    // Lay du lieu hien tai de backfill joinCode / S_* neu thieu
    const snap = await getDoc(userRef);
    const current = snap.exists() ? (snap.data() || {}) : {};

    const patch = {
      status: "approved",
    };

    if (newRole) {
      patch.role = newRole;
    }

    // Neu user duoc duyet tu truoc (chua co joinCode) thi tao bo sung
    if (!current.joinCode) {
      patch.joinCode = generateXncId();
    }

    // Backfill snapshot S_* (giu tuong thich voi schema moi)
    patch.S_metrics = current.S_metrics || {
      S_xp: current.xp ?? 0,
      S_coin: current.coin ?? 0,
      S_level: current.level ?? 1,
    };

    patch.S_behavior = current.S_behavior || {
      S_FI: current.metrics?.fi ?? 0,
      S_PI: current.metrics?.pi ?? 0,
      S_PIStar: current.metrics?.piStar ?? 0,
    };

    patch.S_traits = current.S_traits || {
      S_competitiveness: current.traits?.competitiveness ?? 0,
      S_creativity: current.traits?.creativity ?? 0,
      S_perfectionism: current.traits?.perfectionism ?? 0,
      S_playfulness: current.traits?.playfulness ?? 0,
      S_selfImprovement: current.traits?.selfImprovement ?? 0,
      S_sociability: current.traits?.sociability ?? 0,
    };

    patch.S_time = current.S_time || {
      S_ttfImpactDays: current.timeMetrics?.ttfImpactDays ?? null,
      S_gvPiStar: current.timeMetrics?.gvPiStar ?? null,
      S_consistencyScore: current.timeMetrics?.consistencyScore ?? null,
      S_flag: current.timeMetrics?.flag ?? "NONE",
    };

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
