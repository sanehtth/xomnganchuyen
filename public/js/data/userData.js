// js/data/userData.js
// Cac ham lam viec voi collection `users` trong Firestore
// Chi lam viec voi DATA, khong lam viec voi DOM.

import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "../he-thong/firebase.js";

// =======================
// Schema mac dinh cho 1 user
// =======================
//
// 3 lop chi so chinh:
//  - Cong khai: xp, coin, level
//  - Hanh vi: traits + metrics (PI / FI / PI*)
//  - Thoi gian: timeMetrics (TTFI, Velocity, Consistency, flags)
//
const DEFAULT_PROFILE = {
  // Thong tin co ban
  role: "guest",          // guest | member | associate | admin
  status: "none",         // none | pending | approved | rejected | banned
  id: "",                 // XNC + yy + mm + dd + 7 so, gan khi tao user
  email: "",
  displayName: "User",
  photoUrl: "",

  // Chi so cong khai
  xp: 0,
  coin: 0,
  level: 1,
  joinCode: "",

  // 6 chi so hanh vi (chi de phan vai)
  traits: {
    competitiveness: 0,
    creativity: 0,
    perfectionism: 0,
    playfulness: 0,
    selfImprovement: 0,
    sociability: 0,
  },

  // 3 chi so PI / FI / PI* (chi admin thay)
  metrics: {
    fi: 0,      // Friction – tieu cuc
    pi: 0,      // Participation – tham gia
    piStar: 0,  // Positive Impact – gia tri thuc su
  },

  // Chi so thoi gian (admin-only)
  timeMetrics: {
    ttfI: null,          // Time-to-First-Impact – so ngay
    gvPiStar7d: 0,       // Growth Velocity PI* / ngay (xap xi tren 7 ngay)
    gvPiStar30d: 0,      // Growth Velocity PI* / ngay (xap xi tren 30 ngay)
    cs: 0,               // Consistency Score 0..1
    plateau: false,      // PI* dung lai
    declining: false,    // FI tang / PI* giam
    speedLabel: "UNKNOWN", // FAST_START | STEADY | PLATEAU | DECLINING | SLOW ...
  },

  // Flag phuc vu canh bao / monitor
  signal: {
    plateauFlag: false,
    dropFlag: false,
    surgeFlag: false,
  },

  // Moc thoi gian dang so ms client de tinh nhanh
  joinedAtMs: null,        // Date.now() luc tao tai khoan
  firstImpactAtMs: null,   // Date.now() luc PI* > 0 lan dau
  lastMetricsAtMs: null,   // lan cuoi cap nhat metrics

  // Moc thoi gian server
  createdAt: null,         // serverTimestamp()
  lastActiveAt: null,      // serverTimestamp()
};

// =======================
// Helper: sinh ID XNC
// =======================
export function generateXncId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2); // 2 so cuoi
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const random = Math.floor(Math.random() * 10_000_000)
    .toString()
    .padStart(7, "0"); // 7 so

  // XNC + yy + mm + dd + 7 so = 16 ky tu
  return `XNC${yy}${mm}${dd}${random}`;
}

// =======================
// Helper tinh chi so thoi gian
// =======================

function recomputeTimeMetrics(profile) {
  const nowMs = Date.now();

  const joinedAtMs = profile.joinedAtMs ?? nowMs;
  const firstImpactAtMs = profile.firstImpactAtMs ?? null;

  const piStar = profile.metrics?.piStar ?? 0;
  const fi = profile.metrics?.fi ?? 0;

  // 1) TTFI: neu chua co PI* -> null
  let ttfI = null;
  if (firstImpactAtMs && firstImpactAtMs >= joinedAtMs) {
    const diffDays = (firstImpactAtMs - joinedAtMs) / (1000 * 60 * 60 * 24);
    ttfI = Math.round(diffDays);
  }

  // 2) Velocity: PI* / so ngay ke tu luc join
  const diffDaysFromJoin = Math.max(
    1,
    (nowMs - joinedAtMs) / (1000 * 60 * 60 * 24)
  );
  const gvPerDay = piStar / diffDaysFromJoin;

  // 3) Consistency: so tuan co hoat dong / tong tuan
  const weeksSinceJoin = Math.max(
    1,
    Math.floor((nowMs - joinedAtMs) / (1000 * 60 * 60 * 24 * 7))
  );
  const activeWeeks = profile.activeWeeks ?? 0; // truong nay se tang dan o cho khac
  const cs = Math.max(0, Math.min(1, activeWeeks / weeksSinceJoin));

  // 4) Flags
  const plateau = piStar > 0 && gvPerDay < 0.1;
  const declining = fi > 0 && gvPerDay <= 0;

  // 5) Nhan speed
  let speedLabel = "SLOW";
  if (ttfI !== null && ttfI <= 7 && gvPerDay > 0.5 && cs >= 0.6 && fi === 0) {
    speedLabel = "FAST_START";
  } else if (cs >= 0.6 && gvPerDay >= 0) {
    speedLabel = "STEADY";
  } else if (plateau) {
    speedLabel = "PLATEAU";
  } else if (declining) {
    speedLabel = "DECLINING";
  }

  return {
    ttfI,
    gvPiStar7d: gvPerDay,
    gvPiStar30d: gvPerDay,
    cs,
    plateau,
    declining,
    speedLabel,
  };
}

// =======================
// CRUD profile
// =======================

export async function ensureUserDocument(firebaseUser) {
  if (!firebaseUser) return null;

  const uid = firebaseUser.uid;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data() || {};

    // Ghep schema mac dinh + du lieu cu
    const merged = {
      ...DEFAULT_PROFILE,
      ...data,
      uid,
    };

    // Bao dam co joinedAtMs
    if (!merged.joinedAtMs) {
      merged.joinedAtMs = Date.now();
    }

    // Tinh lai time metrics moi lan load
    const t = recomputeTimeMetrics(merged);

    await updateDoc(userRef, {
      lastActiveAt: serverTimestamp(),
      timeMetrics: t,
    });

    return {
      ...merged,
      timeMetrics: t,
    };
  }

  // Tao profile moi
  const nowMs = Date.now();
  const baseProfile = {
    ...DEFAULT_PROFILE,
    uid,
    id: generateXncId(),
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || firebaseUser.email || "User",
    photoUrl: firebaseUser.photoURL || "",
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
    joinedAtMs: nowMs,
    firstImpactAtMs: null,
    lastMetricsAtMs: nowMs,
    timeMetrics: {
      ttfI: null,
      gvPiStar7d: 0,
      gvPiStar30d: 0,
      cs: 0,
      plateau: false,
      declining: false,
      speedLabel: "SLOW",
    },
  };

  await setDoc(userRef, baseProfile);
  return baseProfile;
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

// Ham giup admin cap nhat traits + metrics
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

  const merged = {
    ...DEFAULT_PROFILE,
    ...current,
    traits: newTraits,
    metrics: newMetrics,
  };

  const t = recomputeTimeMetrics(merged);

  await updateDoc(userRef, {
    traits: newTraits,
    metrics: newMetrics,
    timeMetrics: t,
  });
}
