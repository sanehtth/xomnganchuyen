// public/js/data/adminBehaviorReport.js
// Logic phan tich hanh vi user cho Admin
// Khong dung Firebase o day, chi tinh toan tu data truyen vao

// user.metrics: { fi, pi, piStar }
// user.timeMetrics: { ttfImpactDays, gvPiStar, consistencyScore, flag }
// weeklyLast4: mang 4 object, moi object dai dien 1 tuan (co pi, piStar, fi, ...)

function classifySpeed(timeMetrics = {}, metrics = {}) {
  const gv = timeMetrics.gvPiStar ?? 0;
  const cs = timeMetrics.consistencyScore ?? 0;
  const flag = timeMetrics.flag || "NONE";
  const fi = metrics.fi ?? 0;

  if (flag === "RISK" || fi > 0.7) return "RISK";
  if (flag === "DECLINING") return "DECLINING";
  if (flag === "PLATEAU") return "PLATEAU";

  if (gv > 0.7 && cs >= 0.6) return "FAST_START";
  if (gv > 0.4 && cs >= 0.7) return "STEADY";

  return "SLOW";
}

function summarizeTrend(weeklyLast4 = []) {
  if (!Array.isArray(weeklyLast4) || weeklyLast4.length === 0) {
    return { trendPiStar: "none", trendFi: "none" };
  }

  const last = weeklyLast4[weeklyLast4.length - 1];
  const first = weeklyLast4[0];

  const deltaPiStar = (last.piStar || 0) - (first.piStar || 0);
  const deltaFi = (last.fi || 0) - (first.fi || 0);

  const trendPiStar =
    deltaPiStar > 0.2 ? "up" : deltaPiStar < -0.2 ? "down" : "flat";

  const trendFi = deltaFi > 0.2 ? "up" : deltaFi < -0.2 ? "down" : "flat";

  return { trendPiStar, trendFi };
}

// Ham chinh: build report hanh vi cho 1 user
export function buildUserBehaviorReport({ user, weeklyLast4 = [] }) {
  const metrics = user.S_behavior ? { fi: user.S_behavior.S_FI, pi: user.S_behavior.S_PI, piStar: user.S_behavior.S_PIStar } : (user.metrics || {});
  const traits = user.S_traits ? {
    competitiveness: user.S_traits.S_competitiveness,
    creativity: user.S_traits.S_creativity,
    perfectionism: user.S_traits.S_perfectionism,
    playfulness: user.S_traits.S_playfulness,
    selfImprovement: user.S_traits.S_selfImprovement,
    sociability: user.S_traits.S_sociability,
  } : (user.traits || {});
  const timeMetrics = user.S_time ? {
    ttfImpactDays: user.S_time.S_ttfImpactDays,
    gvPiStar: user.S_time.S_gvPiStar,
    consistencyScore: user.S_time.S_consistencyScore,
    flag: user.S_time.S_flag,
  } : (user.timeMetrics || {});

  const fi = metrics.fi ?? 0;
  const pi = metrics.pi ?? 0;
  const piStar = metrics.piStar ?? 0;

  const ttf = timeMetrics.ttfImpactDays ?? null;
  const gv = timeMetrics.gvPiStar ?? null;
  const cs = timeMetrics.consistencyScore ?? null;
  const timeFlag = timeMetrics.flag || "NONE";

  const speedLabel = classifySpeed(timeMetrics, metrics);
  const { trendPiStar, trendFi } = summarizeTrend(weeklyLast4);

  const summary = [];

  // 1) Tong quan PI* / FI
  if (piStar === 0 && fi === 0) {
    summary.push("Chua tao duoc tac dong ro net; hien dang o muc quan sat.");
  } else {
    summary.push(
      `PI*: ${piStar.toFixed(1)}, FI: ${fi.toFixed(1)}, PI: ${pi.toFixed(1)}.`
    );
  }

  // 2) Toc do & do ben
  if (speedLabel === "FAST_START") {
    summary.push("Bat nhip nhanh, co tiem nang vuot bac (fast start).");
  } else if (speedLabel === "STEADY") {
    summary.push("Nhip tien trien deu, phu hop lam tru cot lau dai.");
  } else if (speedLabel === "PLATEAU") {
    summary.push("PI* dung lai trong vai tuan, nen xem xet giao nhiem vu moi.");
  } else if (speedLabel === "DECLINING") {
    summary.push("Chi so dang giam, nen kiem tra nguyen nhan hoac nhac nho.");
  } else if (speedLabel === "RISK") {
    summary.push("FI cao hoac tang nhanh, can xem ky hanh vi va rule.");
  }

  // 3) Xu huong PI* / FI gan day
  if (trendPiStar === "up") {
    summary.push("PI* dang tang, co xu huong tich cuc gan day.");
  } else if (trendPiStar === "down") {
    summary.push("PI* giam so voi cac tuan truoc, can xem lai dong gop.");
  }

  if (trendFi === "up") {
    summary.push("FI tang, co dau hieu ma sat / rui ro cao hon.");
  }

  // 4) Trait noi bat (de phan vai)
  const traitEntries = Object.entries(traits);
  let topTrait = null;
  if (traitEntries.length > 0) {
    traitEntries.sort((a, b) => (b[1] || 0) - (a[1] || 0));
    const [name, value] = traitEntries[0];
    if (value > 0) {
      topTrait = { name, value };
    }
  }

  const tags = [];
  if (speedLabel === "FAST_START") tags.push("FAST_START");
  if (speedLabel === "STEADY") tags.push("STEADY");
  if (speedLabel === "PLATEAU") tags.push("PLATEAU");
  if (speedLabel === "DECLINING") tags.push("DECLINING");
  if (speedLabel === "RISK") tags.push("RISK");

  if (topTrait) {
    tags.push(`TRAIT_${topTrait.name.toUpperCase()}`);
  }

  const actions = [];

  if (speedLabel === "FAST_START" && fi < 0.4) {
    actions.push("Co the giao nhiem vu lon hon hoac de xuat lam core.");
  } else if (speedLabel === "STEADY") {
    actions.push("Giu nhip, tang dan do kho cua nhiem vu.");
  } else if (speedLabel === "PLATEAU") {
    actions.push("Goi y nhiem vu moi hoac series moi de kick lai PI*.");
  } else if (speedLabel === "DECLINING") {
    actions.push("Kiem tra ly do giam, co the nhac rule hoac call 1-1.");
  } else if (speedLabel === "RISK") {
    actions.push("Gioi han quyen, giam nhiem vu quan trong, co the freeze.");
  }

  if (topTrait) {
    actions.push(
      `Nen sap xep vai tro phu hop voi trait '${topTrait.name}' (vi du: viet, review, mentor...).`
    );
  }

  return {
    summary,
    tags,
    actions,
    raw: {
      metrics: { fi, pi, piStar },
      timeMetrics: { ttfImpactDays: ttf, gvPiStar: gv, consistencyScore: cs, flag: timeFlag },
      trend: { trendPiStar, trendFi },
    },
  };
}
