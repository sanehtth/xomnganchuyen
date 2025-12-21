
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

// Ham giup admin cap nhat chi so traits / metrics cua user
export async function updateUserTraitsAndMetrics(uid, traitsPatch = {}, metricsPatch = {}) {
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
