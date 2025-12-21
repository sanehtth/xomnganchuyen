// js/ung-dung/ui-dashboard.js
// Render giao dien Dashboard
// Chi doc profile tu state, khong lam viec truc tiep voi Firestore

export function renderDashboard(container, firebaseUser, profile) {
  if (!firebaseUser || !profile) {
    container.innerHTML = "<p>Ban chua dang nhap. Hay dang nhap de xem dashboard.</p>";
    return;
  }

  const p = profile;

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

    ${
      p.joinCode
        ? `<p>ID / Join code: <strong>${p.joinCode}</strong></p>`
        : ""
    }

    ${
      p.role === "guest"
        ? `<p>Ban hien la guest. Hay vao tab "Cong thanh vien" de gui yeu cau.</p>`
        : `<p>Ban da la ${p.role}. He thong se bo sung them nhiem vu va bao cao trong tuong lai.</p>`
    }
  `;
}
