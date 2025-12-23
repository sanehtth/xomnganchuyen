// public/js/data/userData.js
// Lam viec voi collection `users` (Firestore) - khong dung DOM o day
// Danh sách email được coi là admin gốc
const ADMIN_EMAILS = ["sane.htth@gmail.com"]; // thêm email khác nếu cần

import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "../he-thong/firebase.js";

// =======================
// Helper: sinh ID XNC 16 ky tu
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

  return `XNC${yy}${mm}${dd}${random}`; // 3 + 2 + 2 + 2 + 7 = 16
}

// =======================
// Helper: sinh refCode (ma gioi thieu)
// =======================
export function generateRefCode(seed = "") {
  const base =
    seed && typeof seed === "string"
      ? seed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
      : "XNC";

  const short = base.slice(0, 4) || "XNC";
  const random = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");

  return `${short}-${random}`; // VD: SANE-023451
}

// =======================
// Schema mac dinh cho user moi
// Chi them truong, khong xoa truong cu
// =======================
const DEFAULT_PROFILE = {
  role: "guest", // guest | member | associate | admin
  status: "none", // none | pending | approved | rejected | banned

  // ID noi bo (XNC + ngay + random)
  id: "",

  // Chi so cong khai
  xp: 0,
  coin: 0,
  level: 1,

  // Snapshot tren Firestore (prefix S_ de tranh nham voi RTDB)
  S_metrics: {
    S_xp: 0,
    S_coin: 0,
    S_level: 1,
  },

  joinCode: "",
  refCode: "",

  // 6 chi so hanh vi (chi admin xem)
  traits: {
    competitiveness: 0,
    creativity: 0,
    perfectionism: 0,
    playfulness: 0,
    selfImprovement: 0,
    sociability: 0,
  },

  // Snapshot tren Firestore (prefix S_)
  S_traits: {
    S_competitiveness: 0,
    S_creativity: 0,
    S_perfectionism: 0,
    S_playfulness: 0,
    S_selfImprovement: 0,
    S_sociability: 0,
  },

  // 3 chi so FI / PI / PI*
  metrics: {
    fi: 0,
    pi: 0,
    piStar: 0,
  },

  // Snapshot tren Firestore (prefix S_)
  S_behavior: {
    S_FI: 0,
    S_PI: 0,
    S_PIStar: 0,
  },

  // Chi so thoi gian (admin-only)
  timeMetrics: {
    // so ngay tu luc join -> co PI* dau tien
    ttfImpactDays: null,
    // toc do tang PI* theo thoi gian
    gvPiStar: null,
    // so tuan co hoat dong / tong so tuan
    consistencyScore: null,
    // label tong quat: FAST_START | STEADY | PLATEAU | DECLINING | RISK | NONE
    flag: "NONE",
  },

  // Snapshot tren Firestore (prefix S_)
  S_time: {
    S_ttfImpactDays: null,
    S_gvPiStar: null,
    S_consistencyScore: null,
    S_flag: "NONE",
  },

  // Counters cong hien (de giai thich vi sao co PI* / FI)
  contributionStats: {
    approvedCount: 0,
    rejectedCount: 0,
    helpfulCount: 0,
    ideaAcceptedCount: 0,
    assetUsedCount: 0,
    lastContributionAt: null,
    activeDays30: 0,
  },

  // Thong tin he thong khac (khong can show het ra UI)
  createdAt: null,
  lastActiveAt: null,
};

// =======================
// Helper: map status noi bo -> status cho UI
// UI chi thay: normal / pending / banned
// =======================
export function getUiAccountStatus(profile) {
  const raw = (profile && profile.status) || "none";

  if (raw === "banned") return "banned";
  if (raw === "pending") return "pending";

  // cac trang thai con lai (none, approved, rejected, ...) xem la binh thuong
  return "normal";
}

// =======================
// Tao object profile ban dau cho user moi
// =======================
function buildBaseProfile(firebaseUser) {
  const uid = firebaseUser.uid;
  const email = firebaseUser.email || "";
  const displayName = firebaseUser.displayName || email || "User";

  return {
    ...DEFAULT_PROFILE,
    uid,
    id: generateXncId(),
    refCode: generateRefCode(uid || email),
    email,
    displayName,
    photoUrl: firebaseUser.photoURL || "",
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  };
}

// =======================
// ensureUserDocument
// - Neu chua co -> tao profile moi (merge DEFAULT + thong tin firebase)
// - Neu co roi -> merge DEFAULT + data cu + cap nhat lastActiveAt
// =======================
export async function ensureUserDocument(firebaseUser) {
  if (!firebaseUser) return null;

  const uid = firebaseUser.uid;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
   // ======Nếu email thuộc admin list -> luôn admin + approved
    const isAdminEmail = ADMIN_EMAILS.includes(firebaseUser.email || "");
    let patched = { ...data };

    if (isAdminEmail) {
      patched.role = "admin";
      patched.status = "approved";
    }

    await updateDoc(userRef, {
      ...patched,
      lastActiveAt: serverTimestamp(),
    });

    return {
      uid,
      ...DEFAULT_PROFILE,
      ...patched,
    };
  
// ====== CHƯA CÓ PROFILE -> TẠO MỚI ======
    const baseProfile = {
    ...DEFAULT_PROFILE,
    uid,
    id: generateXncId(),
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || firebaseUser.email || "User",
    photoUrl: firebaseUser.photoURL || "",
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  };

  if (isAdminEmail) {
    baseProfile.role = "admin";
    baseProfile.status = "approved";
  }

  await setDoc(userRef, baseProfile);
  return baseProfile;

//====== het phan xet email admin====
  if (!snap.exists()) {
    const baseProfile = buildBaseProfile(firebaseUser);
    await setDoc(userRef, baseProfile);
    return baseProfile;
  }

  const current = snap.data() || {};

  const merged = {
    ...DEFAULT_PROFILE, // schema mac dinh
    ...current, // du lieu dang co trong DB
    uid,
    email: firebaseUser.email || current.email || "",
    displayName:
      firebaseUser.displayName || current.displayName || firebaseUser.email || "User",
    photoUrl: firebaseUser.photoURL || current.photoUrl || "",
  };

  // ====== Backfill snapshot S_* neu DB cu chua co (giu tuong thich) ======
  if (!current.S_metrics) {
    merged.S_metrics = {
      S_xp: merged.xp ?? 0,
      S_coin: merged.coin ?? 0,
      S_level: merged.level ?? 1,
    };
  }
  if (!current.S_traits) {
    merged.S_traits = {
      S_competitiveness: merged.traits?.competitiveness ?? 0,
      S_creativity: merged.traits?.creativity ?? 0,
      S_perfectionism: merged.traits?.perfectionism ?? 0,
      S_playfulness: merged.traits?.playfulness ?? 0,
      S_selfImprovement: merged.traits?.selfImprovement ?? 0,
      S_sociability: merged.traits?.sociability ?? 0,
    };
  }
  if (!current.S_behavior) {
    merged.S_behavior = {
      S_FI: merged.metrics?.fi ?? 0,
      S_PI: merged.metrics?.pi ?? 0,
      S_PIStar: merged.metrics?.piStar ?? 0,
    };
  }
  if (!current.S_time) {
    merged.S_time = {
      S_ttfImpactDays: merged.timeMetrics?.ttfImpactDays ?? null,
      S_gvPiStar: merged.timeMetrics?.gvPiStar ?? null,
      S_consistencyScore: merged.timeMetrics?.consistencyScore ?? null,
      S_flag: merged.timeMetrics?.flag ?? "NONE",
    };
  }


  await updateDoc(userRef, {
    lastActiveAt: serverTimestamp(),
    S_metrics: merged.S_metrics,
    S_traits: merged.S_traits,
    S_behavior: merged.S_behavior,
    S_time: merged.S_time,
  });

  return merged;
}

// =======================
// Doc 1 user (theo uid)
// =======================
export async function getUserDocument(uid) {
  if (!uid) return null;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

// =======================
// Cap nhat profile (patch bat ky field nao)
// =======================
export async function updateUserProfile(uid, patch) {
  if (!uid || !patch) return;
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, patch);
}

// =======================
// Cap nhat traits + metrics + timeMetrics (admin dung)
// traitsPatch, metricsPatch, timeMetricsPatch la cac object nho
// chi chua field can thay doi
// =======================
export async function updateUserTraitsAndMetrics(
  uid,
  traitsPatch = {},
  metricsPatch = {},
  timeMetricsPatch = {}
) {
  if (!uid) return;

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const current = snap.data() || {};
  const newTraits = { ...(current.traits || {}), ...traitsPatch };
  const newMetrics = { ...(current.metrics || {}), ...metricsPatch };
  const newTimeMetrics = { ...(current.timeMetrics || {}), ...timeMetricsPatch };

  await updateDoc(userRef, {
    traits: newTraits,
    metrics: newMetrics,
    timeMetrics: newTimeMetrics,
  });
}
