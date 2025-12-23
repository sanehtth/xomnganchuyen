// public/js/data/userData.js
// Firestore: users/{uid}
import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "../he-thong/firebase.js";

// ================
// Helpers: IDs / Codes
// ================
// Realtime ID: 16 ký tự: XNC + yy + mm + dd + 7 số random  => 3 + 2 + 2 + 2 + 7 = 16
export function generateXncId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 10_000_000)).padStart(7, "0");
  return `XNC${yy}${mm}${dd}${random}`;
}

// JoinCode: mã cho member (Firestore). Để dễ nhận diện, dùng JC + 10 ký tự ngẫu nhiên.
export function generateJoinCode() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const rand2 = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `JC${rand}${rand2}`; // 2 + 6 + 4 = 12
}

// ================
// Default profile (Firestore)
// ================
export const DEFAULT_FIRESTORE_PROFILE = {
  // link key
  id: "",               // realtime ID (XNC...)
  // public
  displayName: "",
  email: "",
  photoURL: "",
  role: "guest",        // guest | member | admin
  status: "normal",     // normal | approved | rejected | none
  joinCode: "",         // chỉ set khi member
  level: 1,
  xp: 0,
  coin: 0,

  // metrics (public)
  metrics: { fi: 0, pi: 0, piStar: 0 },

  // counters
  ideaAcceptedCount: 0,
  rejectedCount: 0,
  lastContributionAt: null,

  // Firestore timestamps
  createdAt: null,
  lastActiveAt: null,

  // đồng bộ từ RTDB sang Firestore (đặt prefix S_)
  S_behavior: { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0 },
  S_metrics: { fi: 0, pi: 0, piStar: 0 },
  S_time: { t1: 0, t2: 0, t3: 0, t4: 0 },
  S_syncedAt: null,
};

export function userDocRef(uid) {
  return doc(db, "users", uid);
}

export async function getUserProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? snap.data() : null;
}

// Ensure Firestore user document exists & has required fields.
// - Always ensures: id (realtime ID) exists
// - DOES NOT auto-create joinCode (joinCode is created when approve/member)
export async function ensureUserDocument(firebaseUser) {
  if (!firebaseUser?.uid) return null;

  const ref = userDocRef(firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() || {};
    const patch = {};

    // ensure id
    if (!data.id) patch.id = generateXncId();

    // keep latest public profile if missing
    if (!data.displayName && firebaseUser.displayName) patch.displayName = firebaseUser.displayName;
    if (!data.email && firebaseUser.email) patch.email = firebaseUser.email;
    if (!data.photoURL && firebaseUser.photoURL) patch.photoURL = firebaseUser.photoURL;

    patch.lastActiveAt = serverTimestamp();

    if (Object.keys(patch).length) {
      await updateDoc(ref, patch);
    }
    return { ...data, ...patch };
  }

  const newDoc = {
    ...DEFAULT_FIRESTORE_PROFILE,
    id: generateXncId(),
    displayName: firebaseUser.displayName || "",
    email: firebaseUser.email || "",
    photoURL: firebaseUser.photoURL || "",
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  };

  await setDoc(ref, newDoc, { merge: true });
  return newDoc;
}

export async function updateUserProfile(uid, patch) {
  if (!uid) throw new Error("updateUserProfile: missing uid");
  await updateDoc(userDocRef(uid), { ...patch, lastActiveAt: serverTimestamp() });
}

export async function listUsers() {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// Approve -> set role/status + ensure joinCode if missing
export async function approveUser(uid, role = "member") {
  const ref = userDocRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("approveUser: user doc not found");

  const data = snap.data() || {};
  const patch = {
    role,
    status: "approved",
    lastActiveAt: serverTimestamp(),
  };
  if (!data.joinCode) patch.joinCode = generateJoinCode();
  await updateDoc(ref, patch);
  return { ...data, ...patch };
}

export async function rejectUser(uid) {
  const ref = userDocRef(uid);
  await updateDoc(ref, { status: "rejected", lastActiveAt: serverTimestamp() });
}

export async function ensureJoinCodes(uids = []) {
  let updated = 0;
  for (const uid of uids) {
    const ref = userDocRef(uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) continue;
    const data = snap.data() || {};
    if (!data.joinCode) {
      await updateDoc(ref, { joinCode: generateJoinCode(), lastActiveAt: serverTimestamp() });
      updated++;
    }
  }
  return updated;
}
