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

    // 1) Doc user tu Firestore (nguon chinh cho profile/member)
    const fs = admin.firestore();
    const userRef = fs.doc(`users/${uid}`);
    const userSnap = await userRef.get();
    const user = userSnap.exists ? (userSnap.data() || {}) : {};

    const basePiStar = Number(user.metrics?.piStar || 0);
    const baseFi = Number(user.metrics?.fi || 0);

    // 2) Cham diem (dua tren meta)
    const score = computeScoreFromSubmission(sub, basePiStar, baseFi);

    // 3) Cap nhat Firestore: metrics + snapshot S_*
    const nextPiStar = score.finalPiStar;
    const nextFi = score.finalFi;

    const patch = {
      metrics: {
        ...(user.metrics || {}),
        piStar: nextPiStar,
        fi: nextFi,
      },
      // Snapshot tren Firestore (de Admin doc nhanh / phan biet voi RTDB)
      S_behavior: {
        ...(user.S_behavior || {}),
        S_PIStar: nextPiStar,
        S_FI: nextFi,
        // S_PI giu nguyen neu co
        S_PI: (user.S_behavior?.S_PI ?? user.metrics?.pi ?? 0),
      },
      contributionStats: {
        ...(user.contributionStats || {}),
        // cong don dem (don gian)
        approvedCount: Number(user.contributionStats?.approvedCount || 0) + 1,
        lastContributionAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Backfill S_metrics neu chua co
    if (!user.S_metrics) {
      patch.S_metrics = {
        S_xp: user.xp ?? 0,
        S_coin: user.coin ?? 0,
        S_level: user.level ?? 1,
      };
    }

    await userRef.set(patch, { merge: true });

    // 4) Cap nhat lai submission trong RTDB
    const subRef = admin.database().ref(`/submissions/${sid}`);
    await subRef.update({
      score,
      status: "scored",
    });

    // 5) Day vao queue cho Admin (de lam report / vinh danh)
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
