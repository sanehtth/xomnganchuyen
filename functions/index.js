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
    const sub = snap.val();
    if (!sub || !sub.uid) {
      console.log("submission missing uid, skip", { sid });
      return null;
    }

    const uid = sub.uid;

    // Lay user tu RTDB
    const userRef = admin.database().ref(`/users/${uid}`);
    const userSnap = await userRef.once("value");
    const user = userSnap.val() || {};

    const score = computeScores({ user, submission: sub });

    // Cap nhat lai metrics trong user
    const newMetrics = {
      ...(user.metrics || {}),
      piStar: score.finalPiStar,
      fi: score.finalFi,
    };

    await userRef.update({
      metrics: newMetrics,
      contributionStats: {
        ...(user.contributionStats || {}),
        lastContributionAt: admin.database.ServerValue.TIMESTAMP,
      },
    });

    // Cap nhat lai submission
    const subRef = admin.database().ref(`/submissions/${sid}`);
    await subRef.update({
      score,
      status: "scored",
    });

    // Day vao queue cho Admin (de lam report / vinh danh)
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
