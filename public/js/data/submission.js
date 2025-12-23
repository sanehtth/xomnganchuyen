// public/js/data/submission.js
// Cac ham ho tro fan nop bai (submissions) len Realtime Database

import { rtdb, ref, push, rtdbServerTimestamp } from "../he-thong/firebase.js";

// payload: { type, content, attachments, source, meta }
export async function submitFanSubmission(uid, payload = {}) {
  if (!uid) {
    throw new Error("submitFanSubmission: thieu uid");
  }

  const submissionsRef = ref(rtdb, "submissions");

  const data = {
    uid,
    type: payload.type || "generic",
    content: payload.content || "",
    attachments: Array.isArray(payload.attachments)
      ? payload.attachments
      : [],
    createdAt: rtdbServerTimestamp(),
    status: "pending_review", // cho cloud function + admin xu ly
    source: payload.source || "web",
    meta: payload.meta || {},
  };

  const newRef = await push(submissionsRef, data);

  return {
    id: newRef.key,
    ...data,
  };
}
