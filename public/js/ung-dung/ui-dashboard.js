
// js/ung-dung/ui-dashboard.js
// Render giao dien Dashboard
// Chi doc profile tu state, khong lam viec truc tiep voi Firestore

export function renderDashboard(container, firebaseUser, profile) {
  if (!firebaseUser || !profile) {
    container.innerHTML = "<p>Ban chua dang nhap. Hay dang nhap de xem dashboard.</p>";
    return;
  }

  const p = profile;
  const metrics = p.metrics || {};
  const traits = p.traits || {};

  container.innerHTML = `
    <p>Xin chao, <strong>${p.displayName || firebaseUser.email}</strong></p>
    <p>Email: ${p.email || firebaseUser.email}</p>
    <p>Role: <strong>${p.role || "guest"}</strong></p>
    <p>Status: <strong>${p.status || "none"}</strong></p>

    <h3>Chi so cong khai</h3>
    <ul>
      <li>XP: ${p.xp ?? 0}</li>
      <li>Coin: ${p.coin ?? 0}</li>
      <li>Level: ${p.level ?? 1}</li>
    </ul>

    <h3>Chi so FI / PI / PI*</h3>
    <ul>
      <li>FI: ${metrics.fi ?? 0}</li>
      <li>PI: ${metrics.pi ?? 0}</li>
      <li>PI*: ${metrics.piStar ?? 0}</li>
    </ul>

    ${
      p.joinCode
        ? `<p>ID / Join code: <strong>${p.joinCode}</strong></p>`
        : ""
    }

    <details>
      <summary>6 chi so hanh vi (chi admin va ban quan tam)</summary>
      <ul>
        <li>Competitiveness: ${traits.competitiveness ?? 0}</li>
        <li>Creativity: ${traits.creativity ?? 0}</li>
        <li>Perfectionism: ${traits.perfectionism ?? 0}</li>
        <li>Playfulness: ${traits.playfulness ?? 0}</li>
        <li>Self improvement: ${traits.selfImprovement ?? 0}</li>
        <li>Sociability: ${traits.sociability ?? 0}</li>
      </ul>
    </details>

    ${
      p.role === "guest"
        ? `<p>Ban hien la guest. Hay vao tab "Cong thanh vien" de gui yeu cau.</p>`
        : `<p>Ban da la ${p.role}. He thong se bo sung them nhiem vu va bao cao trong tuong lai.</p>`
    }
  `;
}
