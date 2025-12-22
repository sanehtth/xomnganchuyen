// js/ung-dung/ui-join.js
// Man hinh "Cong thanh vien"

import { requestMembership } from "../data/membershipData.js";
import { getUserDocument, getUiAccountStatus } from "../data/userData.js";

export function renderJoinGate(container, firebaseUser, profile, onProfileUpdate, setStatus) {
  if (!firebaseUser || !profile) {
    container.innerHTML = `
      <div class="card">
        <p>Ban can dang nhap de su dung chuc nang nay.</p>
      </div>
    `;
    return;
  }

  const p = profile;
  const uiStatus = getUiAccountStatus(p); // normal / pending / banned

  // ============ 1. Neu tai khoan bi cam ============
  if (uiStatus === "banned") {
    container.innerHTML = `
      <div class="card">
        <h2>Cong thanh vien</h2>
        <p>Ban hien dang bi <strong>cam</strong> khoi cong dong. Neu ban cho rang co sai sot, hay lien he admin.</p>
      </div>
    `;
    setStatus("banned");
    return;
  }

  // ============ 2. Neu la admin ============
  if (p.role === "admin") {
    container.innerHTML = `
      <div class="card">
        <h2>Cong thanh vien</h2>
        <p>Ban hien la <strong>admin</strong>, status: <strong>normal</strong>.</p>
        <p>Admin khong can gui yeu cau thanh member. Ban co the vao tab <strong>Admin</strong> de quan ly nguoi dung.</p>
      </div>
    `;
    setStatus("normal");
    return;
  }

  // ============ 3. Neu da la member/associate binh thuong ============
  if (p.role === "member" || p.role === "associate") {
    container.innerHTML = `
      <div class="card">
        <h2>Cong thanh vien</h2>
        <p>Ban hien la <strong>${p.role}</strong>, status: <strong>normal</strong>.</p>
        <p>Ban da la thanh vien cua he thong, khong can gui them yeu cau nao nua.</p>
      </div>
    `;
    setStatus("normal");
    return;
  }

  // ============ 4. Cac truong hop con lai (guest) ============
  const isPending = uiStatus === "pending";

  container.innerHTML = `
    <div class="card">
      <h2>Cong thanh vien</h2>

      <p>Ban hien la <strong>${p.role}</strong>, status: <strong>${uiStatus}</strong>.</p>
      <p>
        Neu ban da hoan thanh cac dieu kien (sub kenh, tham gia hoat dong,...),
        hay gui yeu cau de tro thanh member.
      </p>

      <hr />

      <div style="margin:12px 0;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
          <input type="checkbox" id="subscribedCheckBox">
          <span>Da sub kenh YouTube cua he thong.</span>
        </label>
        <small>
          Bam nut nay de mo YouTube. Neu chua sub thi sub,
          neu da sub tu truoc thi chi can dong cua so lai.
          Sau khi ban chac chan da sub, hay tick vao o tren
          de mo nut "Gui yeu cau".
        </small>
      </div>

      <button id="join-request-btn" class="btn btn-primary" disabled>
        ${isPending ? "Da gui yeu cau. Vui long cho admin duyet." : "Gui yeu cau tro thanh member"}
      </button>

      <p id="join-helper" style="margin-top:8px;color:#666;"></p>
    </div>
  `;

  const btn = document.getElementById("join-request-btn");
  const checkbox = document.getElementById("subscribedCheckBox");
  const helper = document.getElementById("join-helper");

  // Neu dang pending thi chi hien thong bao, khong cho bam nua
  if (isPending) {
    checkbox.disabled = true;
    btn.disabled = true;
    helper.textContent = "Yeu cau cua ban dang duoc xu ly. Vui long cho admin duyet.";
    return;
  }

  // Kich hoat nut khi user tick "Da sub"
  checkbox.addEventListener("change", () => {
    btn.disabled = !checkbox.checked;
  });

  // Xu ly gui yeu cau
  btn.addEventListener("click", async () => {
    if (!checkbox.checked) return;

    try {
      btn.disabled = true;
      btn.textContent = "Dang gui yeu cau...";
      helper.textContent = "";

      await requestMembership(firebaseUser.uid);

      // Cap nhat status local
      setStatus("pending");

      // Lay lai profile moi
      const fresh = await getUserDocument(firebaseUser.uid);
      if (fresh && typeof onProfileUpdate === "function") {
        onProfileUpdate(fresh);
      }

      btn.textContent = "Da gui yeu cau. Vui long cho admin duyet.";
      helper.textContent = "Ban co the tiep tuc sinh hoat trong thoi gian cho duyet.";
      checkbox.disabled = true;
    } catch (err) {
      console.error(err);
      alert("Gui yeu cau that bai");
      btn.disabled = false;
      btn.textContent = "Gui yeu cau tro thanh member";
    }
  });
}
