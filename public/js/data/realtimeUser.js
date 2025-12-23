// public/js/data/realtimeUser.js
// Realtime DB chi dung de tracking hanh vi (khong can joinCode/xp/coin)

import { rtdb, rtdbRef, rtdbGet, rtdbSet, rtdbUpdate, rtdbServerTimestamp } from "../he-thong/firebase.js";

const DEFAULT_BEHAVIOR = {
  // 6 chi so hanh vi (ban co the doi ten sau)
  b1: 0,
  b2: 0,
  b3: 0,
  b4: 0,
  b5: 0,
  b6: 0,
};

const DEFAULT_METRICS = {
  fi: 0,
  pi: 0,
  piStar: 0,
};

const DEFAULT_TIME = {
  t1: 0,
  t2: 0,
  t3: 0,
  t4: 0,
};

/**
 * Dam bao user co node trong Realtime DB.
 * Path: users/{uid}
 */
export async function ensureRealtimeUser(uid, profile = null) {
  if (!uid) return null;

  // Workaround: chi de su dung rtdb va tranh tree-shaking
  void rtdb;

  const nodeRef = rtdbRef(rtdb, `users/${uid}`);
  const snap = await rtdbGet(nodeRef);

  if (!snap.exists()) {
    const payload = {
      uid,
      id: uid, // lien ket voi Firestore (id = uid)
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActiveAt: Date.now(),
      lastActiveAtServer: rtdbServerTimestamp(),
      behavior: { ...DEFAULT_BEHAVIOR },
      metrics: { ...DEFAULT_METRICS },
      time: { ...DEFAULT_TIME },
    };

    // Luu them 1 vai thong tin co ban de debug (optional)
    if (profile?.email) payload.email = profile.email;
    if (profile?.displayName) payload.displayName = profile.displayName;

    await rtdbSet(nodeRef, payload);
    return payload;
  }

  // Cap nhat lastActive
  try {
    await rtdbUpdate(nodeRef, {
      lastActiveAt: Date.now(),
      lastActiveAtServer: rtdbServerTimestamp(),
      updatedAt: Date.now(),
    });
  } catch (e) {
    // khong block login
  }

  return snap.val();
}
