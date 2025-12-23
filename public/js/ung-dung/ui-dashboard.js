// public/js/ung-dung/ui-dashboard.js
export function renderDashboardView({ container, firebaseUser, profile }) {
  if (!container) return;

  if (!firebaseUser) {
    container.innerHTML = `
      <h1>Dashboard</h1>
      <p>Bạn chưa đăng nhập.</p>
    `;
    return;
  }

  const safe = (v) => (v === undefined || v === null ? "" : String(v));
  const m = profile?.metrics || { fi: 0, pi: 0, piStar: 0 };

  container.innerHTML = `
    <h1>Dashboard</h1>
    <div class="card">
      <div><b>Xin chào</b>, ${safe(profile?.displayName || firebaseUser.displayName)}</div>
      <div><b>Email</b>: ${safe(profile?.email || firebaseUser.email)}</div>
      <div><b>Role</b>: ${safe(profile?.role || "guest")}</div>
      <div><b>Status</b>: ${safe(profile?.status || "normal")}</div>
      <hr/>
      <div><b>Realtime ID</b>: ${safe(profile?.id || "")}</div>
      <div><b>JoinCode</b>: ${safe(profile?.joinCode || "")}</div>
      <hr/>
      <div><b>XP</b>: ${safe(profile?.xp ?? 0)} | <b>Coin</b>: ${safe(profile?.coin ?? 0)} | <b>Level</b>: ${safe(profile?.level ?? 1)}</div>
      <div><b>Metrics</b>: FI=${safe(m.fi)} | PI=${safe(m.pi)} | PI*=${safe(m.piStar)}</div>
      <p style="opacity:.7;margin-top:10px">Hệ thống sẽ bổ sung thêm nhiệm vụ và báo cáo trong tương lai.</p>
    </div>
  `;
}
