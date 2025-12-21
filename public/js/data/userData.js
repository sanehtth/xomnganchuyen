// js/data/userData.js
// Cac ham lam viec voi collection `users` trong Firestore
// Khong dung DOM trong file nay, chi lam viec voi du lieu

import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "../he-thong/firebase.js";

// =======================
// Cac gia tri mac dinh cho user moi
// =======================
const DEFAULT_PROFILE = {
  role: "guest",       // guest | member | associate | admin
  status: "none",      // none | pending | approved | rejected (UI se map lai)
  id: "",              // se duoc gan bang generateXncId() khi tao user
  xp: 0,
  coin: 0,
  level: 1,
  joinCode: "",
  // 6 chi so hanh vi
  traits: {
    competitiveness: 0,
    creativity: 0,
    perfectionism: 0,
    playfulness: 0,
    selfImprovement: 0,
    sociability: 0,
  },
  // 3 chi so FI / PI / PI*
  metrics: {
    fi: 0,
    pi: 0,
    piStar: 0,
  },
};

// KHÔNG import generateXncId tu chinh file nay nua
// (neu con dong import { generateXncId } from "./userData.js"; thi xoa di)

// =======================
// Tao hoac lay user document
// =======================
export async function ensureUserDocument(firebaseUser) {
  if (!firebaseUser) return null;

  const uid = firebaseUser.uid;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  // Neu da co profile -> chi cap nhat lastActiveAt va merge DEFAULT_PROFILE
  if (snap.exists()) {
    const data = snap.data();

    await updateDoc(userRef, {
      lastActiveAt: serverTimestamp(),
    });

    // tra ve: uid + schema mac dinh + du lieu trong DB
    return {
      uid,
      ...DEFAULT_PROFILE,
      ...data,
    };
  }

  // Chua co profile -> tao moi
  const baseProfile = {
    ...DEFAULT_PROFILE,
    uid,
    id: generateXncId(), // GAN ID XNC o day
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || firebaseUser.email || "User",
    photoUrl: firebaseUser.photoURL || "",
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  };

  await setDoc(userRef, baseProfile);
  return baseProfile;
}

// Doc 1 lan
export async function getUserDocument(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

// Cap nhat profile don gian (patch)
export async function updateUserProfile(uid, patch) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, patch);
}

// Ham giup admin cap nhat chi so traits / metrics cua user
export async function updateUserTraitsAndMetrics(
  uid,
  traitsPatch = {},
  metricsPatch = {}
) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const current = snap.data();
  const newTraits = { ...(current.traits || {}), ...traitsPatch };
  const newMetrics = { ...(current.metrics || {}), ...metricsPatch };

  await updateDoc(userRef, {
    traits: newTraits,
    metrics: newMetrics,
  });
}

// =======================
// Helper map status cho UI
// UI chi dung 3 trang thai: normal / pending / banned
// =======================
export function getUiAccountStatus(profile) {
  const raw = (profile && profile.status) || "none";

  if (raw === "banned") return "banned";   // tai khoan bi cam
  if (raw === "pending") return "pending"; // dang cho duyet

  // cac trang thai con lai (none, approved, rejected, ...) xem la binh thuong
  return "normal";
}

// =======================
// Helper sinh ID XNC + ngay + 7 so random
// Vi du: XNC2512210000457
// =======================
export function generateXncId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2); // 2 so cuoi cua nam
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const random = Math.floor(Math.random() * 10_000_000)
    .toString()
    .padStart(7, "0"); // 7 so

  // XNC + yy + mm + dd + 7 so = 16 ky tu
  return `XNC${yy}${mm}${dd}${random}`;
}
