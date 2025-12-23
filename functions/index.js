// functions/index.js
// Cloud Functions cho Realtime Database (submissions)
// - Trigger khi co submission moi (RTDB)
// - Tinh score
// - Cap nhat Firestore users/{uid}.metrics (khong cap nhat RTDB /users nua)

const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

// =============== Helpers ===============

function clamp01(x) {
  const n = Number(x);
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
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

  const value = clamp01(quality * 0.6 + novelty * 0.4);
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
    const sub = snap.val();

    if (!sub || !sub.uid) {
      console.log("submission missing uid, skip", { sid });
      return null;
    }

    const uid = sub.uid;

    // ===== 1) Lay user tu Firestore =====
    const userRef = admin.firestore().collection("users").doc(uid);
    const userSnap = await userRef.get();
    const user = userSnap.exists ? userSnap.data() : {};

    // ===== 2) Tinh score =====
    const score = computeScores({ user, submission: sub });

    // ===== 3) Cap nhat metrics trong Firestore =====
    const currentMetrics = user && user.metrics ? user.metrics : {};
    const newMetrics = {
      ...currentMetrics,
      piStar: score.finalPiStar,
      fi: score.finalFi,
    };

    await userRef.set(
      {
        metrics: newMetrics,
        contributionStats: {
          ...(user.contributionStats || {}),
          lastContributionAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    // ===== 4) Cap nhat submission trong RTDB =====
    const subRef = admin.database().ref(`/submissions/${sid}`);
    await subRef.update({
      score,
      status: "scored",
    });

    // ===== 5) Day vao queue cho Admin (RTDB) =====
    const queueRef = admin.database().ref("/adminQueues/submissions").push();
    await queueRef.set({
      sid,
      uid,
      status: "awaiting_review",
      createdAt: admin.database.ServerValue.TIMESTAMP,
      snapshot: {
        score,
        submissionType: sub.type || "generic",
      },
    });

    console.log("Scored submission", { sid, uid, score });
    return null;
  });
