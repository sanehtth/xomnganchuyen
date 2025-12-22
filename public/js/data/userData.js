// public/js/data/userData.js
// Làm việc với collection `users` (Firestore) - không dùng DOM ở đây

// Danh sách email được coi là admin gốc (super admin)
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
// Helper: sinh ID XNC 16 ký tự
// Format: XNCYYMMDDXXXXXXX (7 số random)
// =======================
export function generateXncId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10_000_000)
    .toString()
    .padStart(7, "0");

  return `XNC${yy}${mm}${dd}${random}`; // 3 + 2 + 2 + 2 + 7 = 16
}

// =======================
// Helper: sinh refCode (mã giới thiệu)
// =======================
export function generateRefCode(seed = "") {
  const base =
    seed && typeof seed === "string"
      ? seed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
      : "XNC";

  const short = base.slice(0, 4) || "XNC";
  const random = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, "0");

  return `${short}${random}`;
}

// =======================
// DEFAULT_PROFILE: khung dữ liệu mặc định cho 1 user
// =======================
export const DEFAULT_PROFILE = {
  role: "guest", // guest | member | associate | admin
  status: "none", // none | pending | approved | rejected | banned

  level: 1,
  xp: 0,
  coin: 0,

  joinCode: "",
  refCode: "",
  id: "", // XNC ID hiển thị
  email: "",
  displayName: "",
  photoUrl: "",

  createdAt: null,
  lastActiveAt: null,

  // Các chỉ số hành vi / năng lực
  metrics: {
    fi: 0,
    pi: 0,
    piStar: 0,
  },

  // Các chỉ số theo thời gian
  timeMetrics: {
    ttfImpactDays: 0,
    gvPiStar: 0,
    consistencyScore: 0,
    flag: "NONE", // NONE | RISK | DECLINING | ...
  },

  // Traits tính cách / hành vi
  traits: {
    competitiveness: 0,
    creativity: 0,
    perfectionism: 0,
    altruism: 0,
    socialDrive: 0,
    discipline: 0,
  },
};

// =======================
// buildBaseProfile: tạo profile mới từ firebaseUser
// =======================
export function buildBaseProfile(firebaseUser) {
  if (!firebaseUser) return { ...DEFAULT_PROFILE };

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
// getUiAccountStatus: trả về text ngắn để hiển thị UI
// =======================
export function getUiAccountStatus(profile) {
  if (!profile) return "none";

  const status = profile.status || "none";

  if (status === "banned") return "banned";
  if (status === "rejected") return "rejected";
  if (status === "pending") return "pending";
  if (status === "approved") return "normal";

  return "none";
}

// =======================
// ensureUserDocument
// - Nếu chưa có -> tạo profile mới (merge DEFAULT + thông tin firebase)
// - Nếu có rồi -> merge DEFAULT + data cũ + cập nhật lastActiveAt
// - Nếu email thuộc ADMIN_EMAILS -> luôn ép role = admin & status = approved
// =======================
export async function ensureUserDocument(firebaseUser) {
  if (!firebaseUser) return null;

  const uid = firebaseUser.uid;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  // Chuẩn hoá email, dùng để check admin
  const email = (firebaseUser.email || "").toLowerCase();
  const adminList = ADMIN_EMAILS.map((e) => e.toLowerCase());
  const isAdminEmail = adminList.includes(email);

  // ====== CHƯA CÓ PROFILE -> TẠO MỚI ======
  if (!snap.exists()) {
    const baseProfile = buildBaseProfile(firebaseUser);

    if (isAdminEmail) {
      baseProfile.role = "admin";
      baseProfile.status = "approved";
    }

    await setDoc(userRef, baseProfile);
    return baseProfile;
  }

  // ====== ĐÃ CÓ PROFILE -> MERGE + CẬP NHẬT ======
  const current = snap.data() || {};

  const patched = {
    ...DEFAULT_PROFILE,
    ...current,
    uid,
    email: firebaseUser.email || current.email || "",
    displayName:
      firebaseUser.displayName ||
      current.displayName ||
      firebaseUser.email ||
      "User",
    photoUrl: firebaseUser.photoURL || current.photoUrl || "",
  };

  if (isAdminEmail) {
    patched.role = "admin";
    patched.status = "approved";
  }

  await updateDoc(userRef, {
    ...patched,
    lastActiveAt: serverTimestamp(),
  });

  return patched;
}

// =======================
// getUserDocument: đọc profile từ Firestore
// =======================
export async function getUserDocument(uid) {
  if (!uid) return null;

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;

  const data = snap.data() || {};
  return {
    ...DEFAULT_PROFILE,
    ...data,
    uid,
  };
}

// =======================
// Cập nhật profile (patch bất kỳ field nào)
// =======================
export async function updateUserProfile(uid, patch) {
  if (!uid || !patch) return;
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, patch);
}

// =======================
// Cập nhật traits + metrics + timeMetrics (admin dùng)
// traitsPatch, metricsPatch, timeMetricsPatch là các object nhỏ
// chỉ chứa field cần thay đổi
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
