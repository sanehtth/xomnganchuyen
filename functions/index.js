// functions/index.js
// Cloud Functions cho Realtime Database

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Khoi tao admin SDK 1 lan
if (!admin.apps.length) {
  admin.initializeApp();
}

// =============== Helpers ===============

function clamp01(x) {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

// ctx: { user, submission }
function computeScores(ctx) {
  const user = ctx.user || {};
  const sub = ctx.submission || {};

  const metrics = user.metrics || {};
  const basePiStar = metrics.piStar || 0;
  const baseFi = metrics.fi || 0;

  const quality =
    typeof sub.meta?.quality === "number" ? clamp01(sub.meta.quality) : 0.5;

  const novelty =
    typeof sub.meta?.novelty === "number" ? clamp01(sub.meta.novelty) : 0.5;

  const ruleRisk =
    typeof sub.meta?.ruleRisk === "number" ? clamp01(sub.meta.ruleRisk) : 0;

  const value = clamp01((quality * 0.6 + novelty * 0.4));
  const behavior = clamp01(1 - ruleRisk);
  const risk = clamp01(ruleRisk);

  const deltaPiStar = value * behavior * 10;
  const deltaFi = risk * 5;

  return {
    value,
    behavior,
    quality,
    risk,
    finalPiStar: basePiStar + deltaPiStar,
    finalFi: baseFi + deltaFi,
    deltaPiStar,
    deltaFi,
  };
}

// =============== Trigger: khi fan nop bai ===============

exports.onSubmissionCreated = functions.database
  .ref("/submissions/{sid}")
  .onCreate(async (snap, ctx) => {
  const sid = ctx.params.sid;
  const submission = snap.val();

  if (!submission || !submission.uid) {
    console.log("submission missing uid, skip", { sid });
    return null;
  }

  if (typeof isValidSubmission === "function" && !isValidSubmission(submission)) {
    console.log("Invalid submission, skipping:", sid);
    return null;
  }

  const score = computeScoreFromSubmission(submission);
  const fs = admin.firestore();

  // 1) Firestore: luu ban ghi submissions (de admin query)
  try {
    await fs.collection("submissions").doc(sid).set(
      {
        sid,
        uid: submission.uid,
        type: submission.type || submission.kind || "unknown",
        content: submission.content || submission.text || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        sourceCreatedAt: submission.createdAt || null,
        score,
        status: "pending",
        raw: submission,
      },
      { merge: true }
    );

    // prefix S_ theo quy uoc
    await fs.collection("users").doc(submission.uid).set(
      {
        S_submissionCount: admin.firestore.FieldValue.increment(1),
        S_lastSubmissionAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Error writing submission to Firestore:", err);
  }

  // 2) RTDB: hang doi pending cho UI realtime (nhanh)
  try {
    await admin.database().ref(`/adminQueue/pending/${sid}`).set({
      uid: submission.uid,
      type: submission.type || submission.kind || "unknown",
      score,
      createdAt: submission.createdAt || Date.now(),
    });
  } catch (err) {
    console.error("Error updating adminQueue:", err);
  }

  return null;

});

/**
 * Tinh diem nhanh cho submission (de xep hang/uu tien trong hang doi admin).
 * Luu y: scoring chi mang tinh tuong doi; ban co the doi cong thuc bat ky luc nao.
 */
function computeScoreFromSubmission(submission = {}) {
  const type = (submission.type || submission.kind || "unknown").toString().toLowerCase();
  const text = (submission.content || submission.text || submission.message || "").toString();
  const lenScore = Math.min(50, Math.floor(text.trim().length / 20)); // 0..50

  let base = 0;
  if (type.includes("idea")) base = 40;
  else if (type.includes("comment")) base = 20;
  else if (type.includes("report")) base = 30;
  else base = 10;

  // Neu client gui kem chi so hanh vi, cong them nhe
  const b = submission.behavior || submission.b || {};
  const bSum = ["b1","b2","b3","b4","b5","b6"].reduce((s,k)=>s + (Number(b?.[k])||0), 0);
  const behaviorBoost = Math.min(30, Math.floor(bSum / 5));

  return base + lenScore + behaviorBoost;
}

