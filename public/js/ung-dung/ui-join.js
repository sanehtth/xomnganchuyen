
// js/ung-dung/ui-join.js
// Render giao dien Cong thanh vien
// Goi toi membershipData de gui yeu cau

import { requestMembership } from "../data/membershipData.js";
import { getUserDocument } from "../data/userData.js";

export function renderJoinGate(container, firebaseUser, profile, onProfileUpdate, setStatus) {
  if (!firebaseUser || !profile) {
    container.innerHTML = "<p>Ban can dang nhap truoc.</p>";
    return;
  }

  const p = profile;

  // Truong hop admin
  if (p.role === "admin") {
    container.innerHTML = `
      <p>Ban la <strong>admin</strong>. Khong can gui yeu cau thanh vien.</p>
      <p>Hay su dung khu Admin de duyet cac user khac.</p>
    `;
    return;
  }

  // Truong hop da approved
  if (p.status === "approved" && p.role !== "guest") {
    container.innerHTML = `
      <p>Chuc mung, ban da la <strong>${p.role}</strong>.</p>
      ${
        p.joinCode
          ? `<p>Join code cua ban: <strong>${p.joinCode}</strong></p>`
          : ""
      }
      <p>Ban co the quay lai Dashboard de xem chi so tien trinh.</p>
    `;
    return;
  }

  // Pending
  if (p.status === "pending") {
    container.innerHTML = `
      <p>Ban da gui yeu cau tro thanh member.</p>
      <p>Trang thai: <strong>pending</strong>. Vui long cho admin duyet.</p>
    `;
    return;
  }

  // Rejected hoac none
  const isRejected = p.status === "rejected";

  //=============== dang ky member ==============================
  container.innerHTML = `
<p>Bạn hiện là <strong>${p.role}</strong>, status: <strong>${p.status}</strong>.</p>

<p>Nếu bạn đã hoàn thành các điều kiện (sub kênh, tham gia hoạt động,...), hãy làm theo các bước bên dưới để gửi yêu cầu thành member.</p>

<hr>

<div style="margin:12px 0;">
  <h4>Bước 1: Sub kênh YouTube</h4>
  <button id="subChannelBtn" class="btn btn-secondary">
    Sub kênh YouTube
  </button>
  <small style="display:block;margin-top:4px;color:#666;">
    Bấm nút này để mở kênh YouTube của hệ thống.
  </small>
</div>

<div style="margin:12px 0;">
  <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
    <input type="checkbox" id="subscribedCheckbox">
    Tôi đã sub kênh
  </label>
</div>

<hr>

<button id="join-request-btn" class="btn btn-primary" disabled>
  ${isRejected ? "Gửi lại yêu cầu" : "Gửi yêu cầu thành viên"}
</button>

<p id="join-helper" style="margin-top:8px;color:#666;"></p>
`;

//========================= het doan dang ky member ===============

  const btn = document.getElementById("join-request-btn");
  if (btn) {
    btn.addEventListener("click", async () => {
      try {
        btn.disabled = true;
        btn.textContent = "Dang gui yeu cau...";
        await requestMembership(firebaseUser.uid);
        setStatus("Da gui yeu cau. Vui long cho admin duyet.");
        // Doc lai profile moi
        const fresh = await getUserDocument(firebaseUser.uid);
        if (fresh) {
          onProfileUpdate(fresh);
        }
      } catch (err) {
        console.error(err);
        alert("Gui yeu cau that bai");
      } finally {
        btn.disabled = false;
      }
    });
  }
}
