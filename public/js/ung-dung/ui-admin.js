// public/js/ung-dung/ui-admin.js

import { fetchAllUsers, approveUser, setUserRole } from "../data/membershipData.js";

/**
 * Admin Panel
 * @param {HTMLElement} container
 * @param {import("firebase/auth").User} firebaseUser
 */
export async function renderAdminPanel(container, firebaseUser) {
  container.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h3 class="card-title">Admin Panel</h3>
        <p>Xin chao admin, ${firebaseUser.email}</p>
        <p id="admin-message" style="color:#666;font-size:0.9rem;">Da duyệt user.</p>

        <div style="display:flex;gap:8px;align-items:center;margin:12px 0;">
          <label>Loc theo role:
            <select id="filter-role" class="form-select form-select-sm" style="width:auto;display:inline-block;">
              <option value="">Tat ca</option>
              <option value="guest">guest</option>
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
          </label>

          <label>Loc theo status:
            <select id="filter-status" class="form-select form-select-sm" style="width:auto;display:inline-block;">
              <option value="">Tat ca</option>
              <option value="none">none</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="banned">banned</option>
            </select>
          </label>

          <button id="bulk-approve-btn" class="btn btn-primary btn-sm">Duyet da chon</button>
          <button id="bulk-reject-btn" class="btn btn-secondary btn-sm">Tu choi da chon</button>
        </div>

        <div class="table-responsive">
          <table class="table table-sm" id="users-table">
            <thead>
              <tr>
                <th><input type="checkbox" id="select-all"></th>
                <th>Email</th>
                <th>Ten</th>
                <th>Role</th>
                <th>Status</th>
                <th>XP</th>
                <th>Coin</th>
                <th>Level</th>
                <th>FI</th>
                <th>PI</th>
                <th>PI*</th>
                <th>JoinCode</th>
                <th>Hanh dong</th>
              </tr>
            </thead>
            <tbody id="users-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const tbody = document.getElementById("users-tbody");
  const filterRole = document.getElementById("filter-role");
  const filterStatus = document.getElementById("filter-status");
  const selectAll = document.getElementById("select-all");
  const bulkApproveBtn = document.getElementById("bulk-approve-btn");
  const bulkRejectBtn = document.getElementById("bulk-reject-btn");
  const messageEl = document.getElementById("admin-message");

  let allUsers = [];

  function showMessage(text, color = "#666") {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.style.color = color;
  }

  async function loadUsers() {
    allUsers = await fetchAllUsers();
    renderTable();
  }

  function renderTable() {
    if (!tbody) return;

    const roleFilter = filterRole?.value || "";
    const statusFilter = filterStatus?.value || "";

    const filtered = allUsers.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter && u.status !== statusFilter) return false;
      return true;
    });

    tbody.innerHTML = filtered
      .map(
        (u) => `
      <tr>
        <td>
          <input type="checkbox" class="user-select" data-uid="${u.uid}">
        </td>
        <td>${u.email || ""}</td>
        <td>${u.displayName || ""}</td>
        <td>${u.role || "guest"}</td>
        <td>${u.status || "none"}</td>
        <td>${u.xp || 0}</td>
        <td>${u.coin || 0}</td>
        <td>${u.level || 1}</td>
        <td>${(u.metrics && u.metrics.fi) || 0}</td>
        <td>${(u.metrics && u.metrics.pi) || 0}</td>
        <td>${(u.metrics && u.metrics.piStar) || 0}</td>
        <td>${u.joinCode || ""}</td>
        <td>
          <button class="btn btn-outline-success btn-sm single-approve" data-uid="${u.uid}">Duyet</button>
          <button class="btn btn-outline-danger btn-sm single-reject" data-uid="${u.uid}">Tu choi</button>
          <select class="form-select form-select-sm role-select" data-uid="${u.uid}" style="width:auto;display:inline-block;margin-left:4px;">
            <option value="guest" ${u.role === "guest" ? "selected" : ""}>guest</option>
            <option value="member" ${u.role === "member" ? "selected" : ""}>member</option>
            <option value="admin" ${u.role === "admin" ? "selected" : ""}>admin</option>
          </select>
        </td>
      </tr>
    `
      )
      .join("");

    // gắn event cho nút đơn lẻ
    tbody.querySelectorAll(".single-approve").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const uid = e.currentTarget.dataset.uid;
        await approveUser(uid, true);
        showMessage("Da duyet 1 user.", "#28a745");
        await loadUsers();
      });
    });

    tbody.querySelectorAll(".single-reject").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const uid = e.currentTarget.dataset.uid;
        await approveUser(uid, false);
        showMessage("Da tu choi 1 user.", "#e55353");
        await loadUsers();
      });
    });

    tbody.querySelectorAll(".role-select").forEach((sel) => {
      sel.addEventListener("change", async (e) => {
        const uid = e.currentTarget.dataset.uid;
        const role = e.currentTarget.value;
        await setUserRole(uid, role);
        showMessage("Da cap nhat role.", "#17a2b8");
        await loadUsers();
      });
    });
  }

  function getSelectedUids() {
    const boxes = document.querySelectorAll(".user-select:checked");
    return Array.from(boxes).map((cb) => cb.dataset.uid);
  }

  // Check / uncheck all
  if (selectAll) {
    selectAll.addEventListener("change", () => {
      const checked = selectAll.checked;
      document.querySelectorAll(".user-select").forEach((cb) => {
        cb.checked = checked;
      });
    });
  }

  if (bulkApproveBtn) {
    bulkApproveBtn.addEventListener("click", async () => {
      const uids = getSelectedUids();
      if (!uids.length) {
        alert("Chua chon user nao.");
        return;
      }
      if (!confirm(`Duyet ${uids.length} user?`)) return;

      for (const uid of uids) {
        await approveUser(uid, true);
      }
      showMessage(`Da duyet ${uids.length} user.`, "#28a745");
      await loadUsers();
    });
  }

  if (bulkRejectBtn) {
    bulkRejectBtn.addEventListener("click", async () => {
      const uids = getSelectedUids();
      if (!uids.length) {
        alert("Chua chon user nao.");
        return;
      }
      if (!confirm(`Tu choi ${uids.length} user?`)) return;

      for (const uid of uids) {
        await approveUser(uid, false);
      }
      showMessage(`Da tu choi ${uids.length} user.`, "#e55353");
      await loadUsers();
    });
  }

  if (filterRole) {
    filterRole.addEventListener("change", renderTable);
  }
  if (filterStatus) {
    filterStatus.addEventListener("change", renderTable);
  }

  await loadUsers();
}
