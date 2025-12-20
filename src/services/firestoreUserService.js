// src/services/firestoreUserService.js
//
// TẤT CẢ NHỮNG GÌ LIÊN QUAN ĐẾN USER TRONG FIRESTORE NẰM Ở ĐÂY.
//
// - ensureUserDoc(firebaseUser): đảm bảo user có document trong Firestore.
// - logUserEvent(uid, type, options): ghi lại một sự kiện (xem video, gửi prompt,...).
// - rebuildWeeklyForUser(uid, range): tính lại thống kê 1 tuần cho 1 user.
// - rebuildWeeklyForAllUsers(range): (optional) chạy cho tất cả user.
// - CÁC HÀM TÍNH TOÁN (level, metrics, v.v...) đều gom vào 1 chỗ để bạn chỉnh.
//
// Bạn chỉ cần sửa *ở phần cấu hình* nếu muốn thay đổi logic chấm điểm.
//

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { firestore } from "../firebase";

// ======================================================
// 1. CẤU HÌNH & HẰNG SỐ DÙNG CHUNG
// ======================================================

// 6 trait hành vi bạn đang dùng
export const TRAIT_KEYS = [
  "competitiveness",
  "creativity",
  "perfectionism",
  "playfulness",
  "self_improvement",
  "sociability",
];

// Chỉ số công khai cho user
// stats: coin, xp, level

// === HÀM TÍNH LEVEL TỪ XP ===
// Bạn MUỐN level lên theo cách nào thì chỉnh ở đây.
// Ví dụ: mỗi 100 xp lên 1 level. Min = 1.
export function calculateLevelFromXp(totalXp) {
  const base = Math.floor((totalXp || 0) / 100) + 1;
  return base < 1 ? 1 : base;
}

// === HÀM TÍNH 3 METRICS FI / PI / PI* TỪ TRAIT ===
//
// CHÚ Ý: đây chỉ là ví dụ. Bạn muốn dùng công thức khác
// thì thay đổi ở đây. Tất cả nơi khác sẽ gọi hàm này.
export function computeMetricsFromTraits(traits = {}) {
  const t = { ...defaultTraits(), ...traits };

  // Ví dụ:
  // - FI: tập trung / tự kỷ luật => perfectionism + self_improvement
  // - PI: tiềm năng sáng tạo => creativity + playfulness
  // - PI*: tổng hợp + tính cạnh tranh => FI + PI + competitiveness
  const fi = (t.perfectionism || 0) + (t.self_improvement || 0);
  const pi = (t.creativity || 0) + (t.playfulness || 0);
  const pi_star = fi + pi + (t.competitiveness || 0);

  return { fi, pi, pi_star };
}

// === TRAIT MẶC ĐỊNH ===
export function defaultTraits() {
  const obj = {};
  TRAIT_KEYS.forEach((k) => (obj[k] = 0));
  return obj;
}

// === STATS MẶC ĐỊNH ===
export function defaultStats() {
  return {
    coin: 0,
    xp: 0,
    level: 1,
  };
}

// === METRICS MẶC ĐỊNH ===
export function defaultMetrics() {
  return {
    fi: 0,
    pi: 0,
    pi_star: 0,
  };
}

// Helper: tạo skeleton user doc từ FirebaseUser
function buildBaseUserDoc(firebaseUser) {
  const email = firebaseUser.email || "";
  const name =
    firebaseUser.displayName ||
    (email ? email.split("@")[0] : "No name");

  const now = Date.now();

  return {
    uid: firebaseUser.uid,
    email,
    displayName: name,
    photoURL: firebaseUser.photoURL || "",
    createdAt: now,
    lastActiveAt: now,

    // Mặc định cho user mới (sẽ KHÔNG ghi đè nếu doc đã tồn tại)
    role: "guest",         // "guest" | "member" | "associate" | "admin"
    status: "pending",     // "pending" | "approved" | "rejected"
    joinCode: "",          // sẽ được admin tạo sau

    stats: defaultStats(),
    traits: defaultTraits(),
    metrics: defaultMetrics(),

    flags: {
      quizDone: false,
      quizEng: false,
    },
  };
}

// ======================================================
// 2. HÀM ĐẢM BẢO USER CÓ DOCUMENT TRONG FIRESTORE
// ======================================================
//
// GỌI HÀM NÀY SAU KHI LOGIN.
// - Nếu user CHƯA tồn tại trong Firestore -> tạo doc mới.
// - Nếu user ĐÃ tồn tại -> chỉ update thông tin cơ bản
//   (email, displayName, photoURL, lastActiveAt),
//   KHÔNG ghi đè role / status / joinCode / stats / traits / metrics.
//

export async function ensureUserDoc(firebaseUser) {
  if (!firebaseUser) return null;

  const uid = firebaseUser.uid;
  const userRef = doc(firestore, "users", uid);
  const snap = await getDoc(userRef);

  const baseDoc = buildBaseUserDoc(firebaseUser);

  if (!snap.exists()) {
    // User mới -> tạo toàn bộ structure mặc định
    await setDoc(userRef, baseDoc);
    return baseDoc;
  }

  // User đã tồn tại -> merge, KHÔNG ghi đè role/status/...
  const current = snap.data() || {};

  const updatePayload = {
    email: baseDoc.email,
    displayName: baseDoc.displayName,
    photoURL: baseDoc.photoURL,
    lastActiveAt: Date.now(),
  };

  await updateDoc(userRef, updatePayload);

  return {
    ...baseDoc,
    ...current,
    ...updatePayload,
  };
}

// ======================================================
// 3. LOG EVENT HÀNH VI CỦA USER
// ======================================================
//
// MỖI HÀNH ĐỘNG BẠN MUỐN THEO DÕI (xem video, gửi prompt,
// hoàn thành bài tập, làm quiz, ...) -> GỌI logUserEvent.
//
// Sau này weekly job sẽ gom các event này để tính:
// - xpDelta, coinDelta
// - traitImpact (cộng / trừ vào các trait)
//
// Ví dụ sử dụng:
//
// await logUserEvent(uid, "submit_prompt", {
//   xpDelta: 5,
//   coinDelta: 10,
//   traitImpact: { creativity: +1, self_improvement: +1 },
//   metadata: { promptId: "abc123" },
// });
//

export async function logUserEvent(
  uid,
  type,
  {
    xpDelta = 0,
    coinDelta = 0,
    traitImpact = {},
    metadata = {},
  } = {}
) {
  if (!uid) throw new Error("logUserEvent: thiếu uid");

  const eventsCol = collection(firestore, "users", uid, "events");

  const payload = {
    type,
    createdAt: Date.now(), // lưu ms cho dễ query
    xpDelta,
    coinDelta,

    // traitImpact: { creativity: +1, self_improvement: +1, ...}
    traitImpact: {
      ...defaultTraits(),
      ...traitImpact,
    },

    metadata,
  };

  await addDoc(eventsCol, payload);
}

// ======================================================
// 4. HỖ TRỢ TÍNH TUẦN & RANGE
// ======================================================

// Chuyển Date (hoặc ms) -> object gồm start / end của tuần chứa ngày đó
export function getWeekRangeFromDate(dateInput) {
  const d = new Date(dateInput);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday,...

  // CHUẨN HOÁ: coi tuần bắt đầu từ Monday (1)
  // => Monday = 0 offset, Sunday = 6 offset
  const diffToMonday = (day + 6) % 7;

  const start = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() - diffToMonday,
    0,
    0,
    0,
    0
  );
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 7,
    0,
    0,
    0,
    0
  ); // [start, end)

  return {
    startMs: start.getTime(),
    endMs: end.getTime(),
    // key dạng 2025_03 (năm + số tuần)
    weekKey: buildWeekKey(start),
  };
}

// Tạo key tuần: YYYY_WW (WW = số tuần trong năm)
export function buildWeekKey(startDate) {
  const d = new Date(startDate);
  const year = d.getFullYear();

  // Tính số tuần đơn giản: lấy ngày trong năm / 7
  const oneJan = new Date(year, 0, 1);
  const dayOfYear =
    ((d - oneJan) / 86400000) | 0; // ms -> ngày
  const week = Math.floor(dayOfYear / 7) + 1;

  const paddedWeek = String(week).padStart(2, "0");
  return `${year}_${paddedWeek}`;
}

// ======================================================
// 5. TÍNH LẠI WEEKLY CHO 1 USER
// ======================================================
//
// Hàm này sẽ:
// - Lấy events của user trong khoảng [startMs, endMs)
// - Cộng dồn xp, coin, traitDelta.
// - Lấy stats hiện tại của user, tạo bản before/after.
// - Tính lại metrics (FI/PI/PI*)
// - Ghi 1 document vào users/{uid}/weekly/{weekKey}
// - Update users/{uid}.stats + users/{uid}.traits + users/{uid}.metrics
//
// Dùng cho:
// - Nút "Tính lại tuần này" trong Admin.
// - Sau này có thể gọi từ Cloud Functions (cron Chủ nhật).
//

export async function rebuildWeeklyForUser(
  uid,
  { startMs, endMs, weekKey }
) {
  if (!uid) throw new Error("rebuildWeeklyForUser: thiếu uid");

  // 1. Lấy user doc hiện tại
  const userRef = doc(firestore, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error("User không tồn tại trong Firestore");
  }
  const userData = userSnap.data();

  const currentStats = {
    ...defaultStats(),
    ...(userData.stats || {}),
  };
  const currentTraits = {
    ...defaultTraits(),
    ...(userData.traits || {}),
  };

  // 2. Lấy events trong khoảng thời gian
  const eventsCol = collection(firestore, "users", uid, "events");
  const q = query(
    eventsCol,
    where("createdAt", ">=", startMs),
    where("createdAt", "<", endMs)
  );
  const eventsSnap = await getDocs(q);

  let xpEarned = 0;
  let coinEarned = 0;
  const traitDelta = defaultTraits();

  eventsSnap.forEach((docSnap) => {
    const ev = docSnap.data();
    xpEarned += ev.xpDelta || 0;
    coinEarned += ev.coinDelta || 0;
    const impact = ev.traitImpact || {};
    TRAIT_KEYS.forEach((k) => {
      traitDelta[k] += impact[k] || 0;
    });
  });

  // 3. Tính stats sau tuần
  const statsBefore = { ...currentStats };
  const statsAfter = {
    coin: currentStats.coin + coinEarned,
    xp: currentStats.xp + xpEarned,
    // level tính từ total xp
    level: calculateLevelFromXp(currentStats.xp + xpEarned),
  };

  // 4. Tính traits sau tuần (cộng delta)
  const traitsAfter = { ...currentTraits };
  TRAIT_KEYS.forEach((k) => {
    traitsAfter[k] = (traitsAfter[k] || 0) + (traitDelta[k] || 0);
  });

  // 5. Tính lại metrics từ traitsAfter
  const metricsAfter = computeMetricsFromTraits(traitsAfter);

  // 6. Ghi weekly doc
  const weeklyKey =
    weekKey ||
    buildWeekKey(new Date(startMs)); // fallback nếu chưa truyền

  const weeklyRef = doc(
    firestore,
    "users",
    uid,
    "weekly",
    weeklyKey
  );

  const weeklyDoc = {
    weekKey: weeklyKey,
    startMs,
    endMs,

    weeklyStats: {
      xpEarned,
      coinEarned,
      activityCount: eventsSnap.size,
      levelBefore: statsBefore.level,
      levelAfter: statsAfter.level,
    },

    traitDelta,
    traitsAfter,

    metrics: metricsAfter,

    // Có thể thêm field "generatedAt" để biết lúc nào bạn chạy lại
    generatedAt: Date.now(),
  };

  await setDoc(weeklyRef, weeklyDoc, { merge: true });

  // 7. Update user doc với stats/traits/metrics mới
  await updateDoc(userRef, {
    stats: statsAfter,
    traits: traitsAfter,
    metrics: metricsAfter,
  });

  return {
    weeklyDoc,
    statsBefore,
    statsAfter,
    traitsAfter,
    metricsAfter,
  };
}

// ======================================================
// 6. TÍNH LẠI WEEKLY CHO TẤT CẢ USER (OPTIONAL)
// ======================================================
//
// Dùng khi bạn muốn bấm 1 nút trong Admin: "Tính lại tuần này
// cho toàn bộ member".
//
// CHÚ Ý: nếu user nhiều > 1000 thì nên chuyển logic này sang
// Cloud Functions. Với 100 user thử nghiệm thì chạy trên client
// vẫn chịu được, nhưng sẽ hơi chậm.
// 

export async function rebuildWeeklyForAllUsers(range) {
  const { startMs, endMs, weekKey } = range;

  const usersCol = collection(firestore, "users");
  const usersSnap = await getDocs(usersCol);

  const results = [];

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();

    // CHỈ chạy cho member / associate / admin
    if (data.role === "guest") continue;

    const uid = data.uid || userDoc.id;

    const res = await rebuildWeeklyForUser(uid, {
      startMs,
      endMs,
      weekKey,
    });

    results.push({ uid, ...res });
  }

  return results;
}
