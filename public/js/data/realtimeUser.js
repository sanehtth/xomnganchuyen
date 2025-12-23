// public/js/data/realtimeUser.js
// Realtime DB: users/{uid}  (tracking hành vi + time + metrics realtime)
import {
  rtdb,
  rtdbRef,
  rtdbGet,
  rtdbSet,
  rtdbUpdate,
  rtdbServerTimestamp,
} from "../he-thong/firebase.js";

export const DEFAULT_BEHAVIOR = { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0 };
export const DEFAULT_METRICS = { fi: 0, pi: 0, piStar: 0 };
export const DEFAULT_TIME = { t1: 0, t2: 0, t3: 0, t4: 0 };

export function realtimeUserPath(uid) {
  return `users/${uid}`;
}

export async function readRealtimeUser(uid) {
  if (!uid) return null;
  const snap = await rtdbGet(rtdbRef(rtdb, realtimeUserPath(uid)));
  return snap.exists() ? snap.val() : null;
}

// Ensure RTDB node exists. Uses Firestore profile.id as link key.
export async function ensureRealtimeUser(uid, profile) {
  if (!uid) return null;

  const ref = rtdbRef(rtdb, realtimeUserPath(uid));
  const snap = await rtdbGet(ref);

  if (snap.exists()) {
    // update lastActiveAt
    await rtdbUpdate(ref, { lastActiveAt: Date.now() });
    return snap.val();
  }

  const newNode = {
    id: profile?.id || "",
    behavior: { ...DEFAULT_BEHAVIOR },
    metrics: { ...DEFAULT_METRICS },
    time: { ...DEFAULT_TIME },
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };

  await rtdbSet(ref, newNode);
  return newNode;
}

export async function updateBehavior(uid, patch = {}) {
  if (!uid) throw new Error("updateBehavior: missing uid");
  const ref = rtdbRef(rtdb, `${realtimeUserPath(uid)}/behavior`);
  await rtdbUpdate(ref, patch);
}

export async function updateRealtimeMetrics(uid, patch = {}) {
  if (!uid) throw new Error("updateRealtimeMetrics: missing uid");
  const ref = rtdbRef(rtdb, `${realtimeUserPath(uid)}/metrics`);
  await rtdbUpdate(ref, patch);
}

export async function updateRealtimeTime(uid, patch = {}) {
  if (!uid) throw new Error("updateRealtimeTime: missing uid");
  const ref = rtdbRef(rtdb, `${realtimeUserPath(uid)}/time`);
  await rtdbUpdate(ref, patch);
}
