// public/js/ung-dung/ui-join.js
// UI: Cong thanh vien (Member gate)

/**
 * @param {HTMLElement} container  The <div> noi hien UI cong thanh vien
 * @param {object|null} firebaseUser  user tu Firebase Auth
 * @param {object|null} profile  document user trong Firestore
 * @param {function} onProfileUpdate  callback khi profile thay doi (optional)
 * @param {function} setStatusText    ham cap nhat dong trang thai o nav (optional)
 */

import { getUiAccountStatus } from "../data/userData.js";
import { requestMembership } from "../data/membershipData.js";

export function renderJoinGate(
  container,
  firebaseUser,
  profile,
  onProfileUpdate,
  setStatusText
) {
  if (!container) return;

  const p = profile || {};
// === Nếu là admin thì không cần join gate ===
  if (p.role === "admin") {
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3 class="card-title">Cộng thành viên</h3>
          <p>Bạn là <strong>admin</strong>. Không cần gửi yêu cầu trở thành member.</p>
          <p>Hãy dùng tab <strong>Admin</strong> để quản lý người dùng và báo cáo.</p>
        </div>
      </div>
    `;
    return;
  }
  
  const uiStatus = getUiAccountStatus(p); // normal | pending | banned

  // --- Tinh trang nut & text theo status ---
  let buttonDisabled = false;
  let buttonLabel = "Gửi yêu cầu trở thành member";
  let helperText =
    "Nếu bạn đã hoàn thành các điều kiện (sub kênh, tham gia hoạt động,...), hãy gửi yêu cầu để trở thành member.";

  if (uiStatus === "pending") {
    buttonDisabled = true;
    buttonLabel = "Đã gửi yêu cầu. Vui lòng chờ admin duyệt.";
    helperText = "Yêu cầu của bạn đang được xử lý. Vui lòng chờ admin.";
  } else if (uiStatus === "banned") {
    buttonDisabled = true;
    buttonLabel = "Tài khoản đã bị cấm";
    helperText = "Bạn đã bị cấm truy cập hệ thống. Nếu có nhầm lẫn, hãy liên hệ admin.";
  }

  // --- Render HTML vao chinh container (KHONG dung joinSection nua) ---
  container.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h3 class="card-title">Cộng thành viên</h3>
        <p>Ban hiện là <strong>${p.role || "guest"}</strong>, status: <strong>${uiStatus}</strong>.</p>
        <p>
          Nếu bạn đã hoàn thành các điều kiện (sub kênh, tham gia hoạt động,...),
          hãy gửi yêu cầu để trở thành member.
        </p>

        <hr />

        <div style="margin:12px 0;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="subscribedCheck" />
            <span>Đã sub kênh YouTube của hệ thống.</span>
          </label>
          <small style="display:block;margin-top:4px;color:#666;">
            Bấm nút này để mở kênh YouTube của hệ thống. Nếu chưa sub thì sub,
            nếu đã sub từ trước thì chỉ cần đóng cửa sổ lại. Sau khi chắc chắn đã sub,
            hãy tick vào ô trên để mở nút "Gửi yêu cầu".
          </small>
        </div>

        <button
          id="join-request-btn"
          class="btn btn-primary"
          ${buttonDisabled ? "disabled" : ""}
        >
          ${buttonLabel}
        </button>

        <p id="join-helper" style="margin-top:8px;color:#666;">
          ${helperText}
        </p>
      </div>
    </div>
  `;

  const checkbox = container.querySelector("#subscribedCheck");
  const btn = container.querySelector("#join-request-btn");
  const helper = container.querySelector("#join-helper");

  if (!btn || !checkbox) return;

  // Neu dang pending / banned thi khong cho bam gi nua
  if (buttonDisabled) {
    checkbox.disabled = true;
    return;
  }

  // Chua tick => khong cho bam
  btn.disabled = !checkbox.checked;

  // Khi tick/bo tick checkbox => enable/disable button
  checkbox.addEventListener("change", () => {
    btn.disabled = !checkbox.checked;
  });

  // Xu ly su kien bam "Gửi yêu cầu"
  btn.addEventListener("click", async () => {
    if (!firebaseUser) {
      alert("Bạn cần đăng nhập trước khi gửi yêu cầu.");
      return;
    }

    try {
      btn.disabled = true;
      btn.textContent = "Đang gửi yêu cầu...";
      await requestMembership(firebaseUser.uid);

      // Cap nhat trang thai local
      const nextProfile = { ...p, status: "pending" };
      if (typeof onProfileUpdate === "function") {
        onProfileUpdate(nextProfile);
      }

      if (helper) {
        helper.textContent = "Đã gửi yêu cầu. Vui lòng chờ admin duyệt.";
      }
      if (typeof setStatusText === "function") {
        setStatusText("Đã gửi yêu cầu. Vui lòng chờ admin duyệt.");
      }

      btn.textContent = "Đã gửi yêu cầu. Vui lòng chờ admin duyệt.";
    } catch (err) {
      console.error("Lỗi gửi yêu cầu thành member:", err);
      alert("Gửi yêu cầu thất bại. Vui lòng thử lại.");
      btn.disabled = false;
      btn.textContent = "Gửi yêu cầu trở thành member";
    }
  });
}
