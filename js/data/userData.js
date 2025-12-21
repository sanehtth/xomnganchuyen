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

// Cac gia tri mac dinh cho user moi
const DEFAULT_PROFILE = {
  role: "guest",       // guest | member | associate | admin
  status: "none",      // none | pending | approved | rejected
  xp: 0,
  coin: 0,
  level: 1,
  joinCode: "",
  traits: {
    competitiveness: 0,
    creativity: 0,
    perseverance: 0,
    discipline: 0,
    teamwork: 0,
    communication: 0,
  },
  scores: {
    growthIndex: 0,
    reliabilityIndex: 0,
    talentIndex: 0,
  },
};

export async function ensureUserDocument(firebaseUser) {
  if (!firebaseUser) return null;
  const uid = firebaseUser.uid;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  const baseData = {
    uid,
    displayName: firebaseUser.displayName || firebaseUser.email || "User",
    email: firebaseUser.email || "",
    photoURL: firebaseUser.photoURL || "",
  };

  if (!snap.exists()) {
    // User moi: tao document voi gia tri mac dinh
    const docData = {
      ...baseData,
      ...DEFAULT_PROFILE,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    };
    await setDoc(userRef, docData);
    // Lan dau, createdAt co the la null tren client (vi serverTimestamp),
    // nhung dieu nay khong anh huong logic
    return docData;
  }

  // User da ton tai: cap nhat thong tin co ban + lastActiveAt
  const current = snap.data();
  const patch = {
    ...baseData,
    lastActiveAt: serverTimestamp(),
  };

  await updateDoc(userRef, patch);

  return { ...current, ...patch };
}

export async function getUserDocument(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid, patch) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, patch);
}

// Hàm giup admin cap nhat chi so traits/scores cua user
export async function updateUserTraitsAndScores(uid, traitsPatch = {}, scoresPatch = {}) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const current = snap.data();
  const newTraits = { ...(current.traits || {}), ...traitsPatch };
  const newScores = { ...(current.scores || {}, ...scoresPatch) };

  await updateDoc(userRef, {
    traits: newTraits,
    scores: newScores,
  });
}
