// public/js/ung-dung/ui-dashboard.js

import { getUiAccountStatus } from "../data/userData.js";

/**
 * Dashboard cho user
 * @param {HTMLElement} container
 * @param {import("firebase/auth").User} firebaseUser
 * @param {Object} profile - hồ sơ user trong Firestore
 */
export function renderDashboard(container, firebaseUser, profile) {
  const p = profile || {};
  const metrics = p.S_behavior ? { fi: p.S_behavior.S_FI, pi: p.S_behavior.S_PI, piStar: p.S_behavior.S_PIStar } : (p.metrics || {});
  const traits = p.S_traits ? {
    competitiveness: p.S_traits.S_competitiveness,
    creativity: p.S_traits.S_creativity,
    perfectionism: p.S_traits.S_perfectionism,
    playfulness: p.S_traits.S_playfulness,
    selfImprovement: p.S_traits.S_selfImprovement,
    sociability: p.S_traits.S_sociability,
  } : (p.traits || {});
  const pub = p.S_metrics ? { xp: p.S_metrics.S_xp, coin: p.S_metrics.S_coin, level: p.S_metrics.S_level } : { xp: (p.xp ?? 0), coin: (p.coin ?? 0), level: (p.level ?? 1) };

  const uiStatus = getUiAccountStatus(p); // normal | pending | banned

  container.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h3 class="card-title">Dashboard</h3>
        <p>Xin chào, <strong>${p.displayName || firebaseUser.displayName || firebaseUser.email}</strong></p>
        <p>Email: <strong>${p.email || firebaseUser.email}</strong></p>
        <p>Role: <strong>${p.role || "guest"}</strong></p>
        <p>Status: <strong>${uiStatus}</strong></p>
        ${p.id ? `<p>ID: <strong>${p.id}</strong></p>` : ""}

        <h5 style="margin-top:20px;">Chỉ số công khai</h5>
        <ul>
          <li>XP: ${pub.xp || 0}</li>
          <li>Coin: ${pub.coin || 0}</li>
          <li>Level: ${pub.level || 1}</li>
        </ul>

        <h5>Chỉ số FI / PI / PI*</h5>
        <ul>
          <li>FI: ${metrics.fi || 0}</li>
          <li>PI: ${metrics.pi || 0}</li>
          <li>PI*: ${metrics.piStar || 0}</li>
        </ul>

        <details style="margin-top:12px;">
          <summary>6 chỉ số hành vi (chỉ admin và bạn quan tâm)</summary>
          <ul>
            <li>Competitiveness: ${traits.competitiveness || 0}</li>
            <li>Creativity: ${traits.creativity || 0}</li>
            <li>Perfectionism: ${traits.perfectionism || 0}</li>
            <li>Playfulness: ${traits.playfulness || 0}</li>
            <li>Self improvement: ${traits.selfImprovement || 0}</li>
            <li>Sociability: ${traits.sociability || 0}</li>
          </ul>
        </details>

        <p style="margin-top:16px;font-size:0.9rem;color:#666;">
          Hệ thống sẽ bổ sung thêm nhiệm vụ và báo cáo trong tương lai.
        </p>
      </div>
    </div>
  `;
}
