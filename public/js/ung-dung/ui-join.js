// public/js/ung-dung/ui-join.js

import { requestMembership } from "../data/membershipData.js";
import { getUserDocument, getUiAccountStatus } from "../data/userData.js";

/**
 * Trang "Cộng thành viên"
 * @param {HTMLElement} container
 * @param {import("firebase/auth").User} firebaseUser
 * @param {Object} profile
 * @param {(profile:Object) => void} onProfileUpdate
 * @param {(status:string) => void} setStatus
 */
export function renderJoinGate(container, firebaseUser, profile, onProfileUpdate, setStatus) {
  const p = profile || {};
  const uiStatus = getUiAccountStatus(p); // normal | pending | banned
  const isPending = uiStatus === "pending";
  const isBanned = uiStatus === "banned";
  const isRejected = p.status === "rejected";

  const role = p.role || "guest";

  container.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h3 class="card-title">Cộng thành viên</h3>
        <p>Ban hiện là <strong>${role}</strong>, status: <strong>${uiStatus}</strong>.</p>

        <p>
          Neu ban da hoan thanh cac dieu kien (sub kenh, tham gia hoat dong,...),
          hay gui yeu cau de tro thanh member.
        </p>

        ${
          isRejected
            ? `<p style="color:#e55353;">Yeu cau truoc day cua ban da bi tu choi. Neu da dat du dieu kien, ban co the gui lai yeu cau.</p>`
            : ""
        }

        <hr />

        <div style="margin:12px 0;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" id="subscribedCheck">
            <span>Da sub kenh YouTube cua he thong.</span>
          </label>
          <small>
            Bam nut nay de mo YouTube. Neu chua sub thi sub, neu da sub tu truoc thi chi can dong cua so lai.
            Sau khi ban chac chan da sub, hay tick vao o tren de mo nut "Gui yeu cau".
          </small>
        </div>

        <button id="join-request-btn" class="btn btn-primary" disabled>
          ${isRejected ? "Gui lai yeu cau" : "Gui yeu cau thanh vien"}
        </button>

        <p id="join-helper" style="margin-top:8px;color:#666;font-size:0.9rem;"></p>
      </div>
    </div>
  `;

  const btn = document.getElementById("join-request-btn");
  const subscribedCheck = document.getElementById("subscribedCheck");
  const helper = document.getElementById("join-helper");

  function updateHelper(text, color = "#666") {
    if (!helper) return;
    helper.textContent = text;
    helper.style.color = color;
  }

  // ====== Enable / disable nút gửi yêu cầu theo trạng thái ======
  function syncJoinButtonState() {
    if (!btn) return;

    // Bị cấm hoặc đang pending thì khóa hẳn
    if (isBanned) {
      btn.disabled = true;
      updateHelper("Tai khoan cua ban dang bi cam, khong the gui yeu cau.", "#e55353");
      return;
    }

    if (isPending) {
      btn.disabled = true;
      updateHelper("Ban da gui yeu cau truoc do. Vui long cho admin duyet.", "#6c757d");
      return;
    }

    // Trạng thái normal: phải tick "Đã sub kênh" mới cho gửi
    const checked = !!(subscribedCheck && subscribedCheck.checked);
    btn.disabled = !checked;

    if (!checked) {
      updateHelper("Hay tick 'Da sub kenh' de mo nut 'Gui yeu cau'.");
    } else {
      updateHelper("");
    }
  }

  if (subscribedCheck) {
    subscribedCheck.addEventListener("change", syncJoinButtonState);
  }
  syncJoinButtonState();

  // ==================== Xử lý gửi yêu cầu member ====================
  if (btn) {
    btn.addEventListener("click", async () => {
      try {
        btn.disabled = true;
        btn.textContent = "Dang gui yeu cau...";
        updateHelper("");

        await requestMembership(firebaseUser.uid);

        // Cập nhật status hiển thị (pending)
        setStatus && setStatus("pending");

        const fresh = await getUserDocument(firebaseUser.uid);
        if (fresh && onProfileUpdate) {
          onProfileUpdate(fresh);
        }

        btn.textContent = "Da gui yeu cau. Vui long cho admin duyet.";
        updateHelper("Da gui yeu cau. Vui long cho admin duyet.", "#28a745");
      } catch (err) {
        console.error(err);
        alert("Gui yeu cau that bai");
        btn.textContent = isRejected ? "Gui lai yeu cau" : "Gui yeu cau thanh vien";
      } finally {
        // Không enable lại nút nếu đã gửi thành công; người dùng chờ duyệt
        syncJoinButtonState();
      }
    });
  }
}
