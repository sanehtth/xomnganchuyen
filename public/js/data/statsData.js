// public/js/data/statsData.js
// Đồng bộ: Realtime -> Firestore (prefix S_)
import {
  db,
  doc,
  updateDoc,
  serverTimestamp,
} from "../he-thong/firebase.js";
import { readRealtimeUser } from "./realtimeUser.js";

export async function syncRealtimeToFirestore(uid) {
  if (!uid) return { ok: false, reason: "missing uid" };

  const rt = await readRealtimeUser(uid);
  if (!rt) return { ok: false, reason: "no realtime data" };

  const ref = doc(db, "users", uid);
  const patch = {
    S_behavior: rt.behavior || null,
    S_metrics: rt.metrics || null,
    S_time: rt.time || null,
    S_syncedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  };
  await updateDoc(ref, patch);
  return { ok: true };
}
