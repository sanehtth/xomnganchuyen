// js/data/realtimeUser.js
// Realtime chỉ dùng cho guest + tracking hành vi

import { rtdb, ref, get, set, update } from "../he-thong/firebase.js";
import { generateXncId } from "./userData.js"; // bạn đã có sẵn hàm này

export async function ensureRealtimeUser(firebaseUser) {
  const uid = firebaseUser.uid;
  const userRef = ref(rtdb, `users/${uid}`);

  const snap = await get(userRef);
  const now = Date.now();

  if (snap.exists()) {
    // chỉ update lastActiveAt
    await update(userRef, { lastActiveAt: now });
    return snap.val();
  }

  // Chưa có -> tạo mới guest realtime
  const rtId = generateXncId(); // ID 16 ký tự kiểu XNC...

  const payload = {
    uid,
    rtId,
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || "",
    photoURL: firebaseUser.photoURL || "",
    createdAt: now,
    lastActiveAt: now,

    // 6 chỉ số hành vi (realtime)
    behavior: {
      b1: 0,
      b2: 0,
      b3: 0,
      b4: 0,
      b5: 0,
      b6: 0,
    },

    // 3 metrics realtime
    metrics: {
      fi: 0,
      pi: 0,
      piStar: 0,
    },

    // 4 chỉ số thời gian realtime
    timers: {
      t1: 0,
      t2: 0,
      t3: 0,
      t4: 0,
    },
  };

  await set(userRef, payload);
  return payload;
}
