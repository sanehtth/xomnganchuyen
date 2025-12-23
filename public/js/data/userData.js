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

  // 3 chi so FI / PI / PI*
  metrics: {
    fi: 0,
    pi: 0,
    piStar: 0,
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

// =======================
// Snapshot (S_*) - du lieu chot tren Firestore (de bao cao / truy van on dinh)
// Giữ song song với fields cũ trong giai đoạn test để không vỡ UI.
// =======================
S_metrics: {
  S_xp: 0,
  S_coin: 0,
  S_level: 1,
},
S_traits: {
  S_competitiveness: 0,
  S_creativity: 0,
  S_perfectionism: 0,
  S_playfulness: 0,
  S_selfImprovement: 0,
  S_sociability: 0,
},
S_behavior: {
  S_FI: 0,
  S_PI: 0,
  S_PIStar: 0,
},
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
  const email = firebaseUser.email || "";
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  const isAdminEmail = ADMIN_EMAILS.includes(email);

  // Helper: build patch S_* from existing fields (neu chua co)
  const buildSnapshotPatch = (base) => {
    const patch = {};

    // S_metrics
    if (!base.S_metrics) {
      patch.S_metrics = {
        S_xp: Number(base.xp ?? 0),
        S_coin: Number(base.coin ?? 0),
        S_level: Number(base.level ?? 1),
      };
    }

    // S_traits
    if (!base.S_traits) {
      const t = base.traits || {};
      patch.S_traits = {
        S_competitiveness: Number(t.competitiveness ?? 0),
        S_creativity: Number(t.creativity ?? 0),
        S_perfectionism: Number(t.perfectionism ?? 0),
        S_playfulness: Number(t.playfulness ?? 0),
        S_selfImprovement: Number(t.selfImprovement ?? 0),
        S_sociability: Number(t.sociability ?? 0),
      };
    }

    // S_behavior
    if (!base.S_behavior) {
      const m = base.metrics || {};
      patch.S_behavior = {
        S_FI: Number(m.fi ?? 0),
        S_PI: Number(m.pi ?? 0),
        S_PIStar: Number(m.piStar ?? 0),
      };
    }

    // S_time
    if (!base.S_time) {
      const tm = base.timeMetrics || {};
      patch.S_time = {
        S_ttfImpactDays: tm.ttfImpactDays ?? null,
        S_gvPiStar: tm.gvPiStar ?? null,
        S_consistencyScore: tm.consistencyScore ?? null,
        S_flag: tm.flag || "NONE",
      };
    }

    return patch;
  };

  // ====== CREATE
  if (!snap.exists()) {
    const base = buildBaseProfile(firebaseUser);

    // admin override
    if (isAdminEmail) {
      base.role = "admin";
      base.status = "approved";
    }

    // snapshot S_* khoi tao
    const snapshotPatch = buildSnapshotPatch(base);

    const toWrite = {
      ...base,
      ...snapshotPatch,
    };

    await setDoc(userRef, toWrite, { merge: true });
    return toWrite;
  }

  // ====== UPDATE / PATCH
  const existing = snap.data() || {};

  const patched = {
    // merge DEFAULT -> existing -> computed identity fields
    ...DEFAULT_PROFILE,
    ...existing,
    uid,
    email: existing.email || email,
    displayName: existing.displayName || firebaseUser.displayName || email || "User",
    photoUrl: existing.photoUrl || firebaseUser.photoURL || "",
    lastActiveAt: serverTimestamp(),
  };

  // đảm bảo id/refCode (cho user cũ)
  if (!patched.id) patched.id = generateXncId();
  if (!patched.refCode) patched.refCode = generateRefCode(uid || email);

  // admin override
  if (isAdminEmail) {
    patched.role = "admin";
    patched.status = "approved";
  }

  // backfill snapshot S_*
  const snapshotPatch = buildSnapshotPatch(patched);

  // Chỉ update các trường cần thiết (không ghi đè toàn bộ)
  await updateDoc(userRef, {
    uid: patched.uid,
    email: patched.email,
    displayName: patched.displayName,
    photoUrl: patched.photoUrl,
    role: patched.role,
    status: patched.status,
    id: patched.id,
    refCode: patched.refCode,
    lastActiveAt: patched.lastActiveAt,
    ...snapshotPatch,
  });

  return { ...patched, ...snapshotPatch };
}

// =======================
// getUserDocument
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
