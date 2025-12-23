// public/js/ung-dung/ui-join.js
import { updateUserProfile } from "../data/userData.js";

export function renderJoinView({ container, firebaseUser, profile }) {
  if (!container) return;

  if (!firebaseUser) {
    container.innerHTML = `
      <h1>Cộng thành viên</h1>
      <p>Bạn cần đăng nhập để tham gia.</p>
    `;
    return;
  }

  container.innerHTML = `
    <h1>Cộng thành viên</h1>
    <div class="card">
      <p>Hiện tại joinCode chỉ được cấp khi admin duyệt. Bạn có thể cập nhật tên hiển thị tại đây (tuỳ chọn).</p>
      <label style="display:block;margin:8px 0 4px">Tên hiển thị</label>
      <input id="joinDisplayName" type="text" style="width:100%;padding:8px" value="${(profile?.displayName || firebaseUser.displayName || "").replaceAll('"','&quot;')}"/>
      <button id="btnSaveName" style="margin-top:10px">Lưu</button>
      <div id="joinMsg" style="margin-top:10px;opacity:.8"></div>
    </div>
  `;

  const btn = document.getElementById("btnSaveName");
  const msg = document.getElementById("joinMsg");
  btn?.addEventListener("click", async () => {
    const name = document.getElementById("joinDisplayName")?.value?.trim() || "";
    try {
      await updateUserProfile(firebaseUser.uid, { displayName: name });
      if (msg) msg.textContent = "Đã lưu.";
    } catch (e) {
      console.error(e);
      if (msg) msg.textContent = "Lỗi khi lưu.";
    }
  });
}
