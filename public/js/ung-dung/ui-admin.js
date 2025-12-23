// js/ung-dung/ui-admin.js
// Man hinh Admin Panel: xem danh sach user, loc, duyet, doi role

import {
  fetchAllUsers,
  approveUser,
  setUserRole,
} from "../data/membershipData.js";
import { getUiAccountStatus } from "../data/userData.js";

// Ham chinh duoc main.js goi
// container: element chua noi dung
// firebaseUser: user dang login (auth)
// profile: profile trong Firestore cua user dang login
// onProfileUpdate: callback khi admin doi thong tin chinh minh
export async function loadAndRenderAdmin(container, firebaseUser, profile, onProfileUpdate) {
  // Khong login
  if (!firebaseUser || !profile) {
    container.innerHTML = `
      <div class="card">
        <p>Ban can dang nhap de xem Admin Panel.</p>
      </div>
    `;
    return;
  }

  // Khong phai admin
  if (profile.role !== "admin") {
    container.innerHTML = `
      <div class="card">
        <p>Ban khong co quyen truy cap khu vuc Admin.</p>
      </div>
    `;
    return;
  }

  // Khung giao dien admin
  container.innerHTML = `
    <div class="card">
      <h2>Admin Panel</h2>
      <p>Xin chao, <strong>${profile.displayName || firebaseUser.email}</strong> (admin)</p>

      <div style="margin: 12px 0; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <label>
          Loc theo role:
          <select id="admin-filter-role">
            <option value="">Tat ca</option>
            <option value="guest">Guest</option>
            <option value="member">Member</option>
            <option value="associate">Associate</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>
          Loc theo status:
          <select id="admin-filter-status">
            <option value="">Tat ca</option>
            <option value="none">None</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="banned">Banned</option>
          </select>
        </label>

        <button id="admin-approve-selected" class="btn btn-primary">
          Duyet (approve) nhung user da check
        </button>
      </div>

      <div style="overflow-x:auto;">
        <table class="table table-striped" style="min-width:900px;">
          <thead>
            <tr>
              <th><input type="checkbox" id="admin-check-all" /></th>
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
          <tbody id="admin-users-tbody">
            <tr><td colspan="13">Dang tai danh sach nguoi dung...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const tbody = document.getElementById("admin-users-tbody");
  const filterRole = document.getElementById("admin-filter-role");
  const filterStatus = document.getElementById("admin-filter-status");
  const checkAll = document.getElementById("admin-check-all");
  const approveSelectedBtn = document.getElementById("admin-approve-selected");

  let allUsers = [];

  // Tai danh sach user tu Firestore
  try {
    allUsers = await fetchAllUsers();
  } catch (err) {
    console.error("Loi fetchAllUsers:", err);
    tbody.innerHTML = `<tr><td colspan="13">Khong tai duoc danh sach user.</td></tr>`;
    return;
  }

  function applyFilters(list) {
    const roleVal = filterRole.value;
    const statusVal = filterStatus.value;

    return list.filter((u) => {
      if (roleVal && u.role !== roleVal) return false;
      if (statusVal && u.status !== statusVal) return false;
      return true;
    });
  }

  function renderTable() {
    const filtered = applyFilters(allUsers);

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="13">Khong co user phu hop.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered
      .map((u) => {
        const traits = u.traits || {};
        const metrics = u.metrics || {};
        const statusUi = getUiAccountStatus(u);

        return `
          <tr data-uid="${u.uid}">
            <td><input type="checkbox" class="admin-row-check" /></td>
            <td>${u.email || ""}</td>
            <td>${u.displayName || ""}</td>
            <td>${u.role || "guest"}</td>
            <td>${u.status || "none"} (${statusUi})</td>
            <td>${u.xp ?? 0}</td>
            <td>${u.coin ?? 0}</td>
            <td>${u.level ?? 1}</td>
            <td>${metrics.fi ?? 0}</td>
            <td>${metrics.pi ?? 0}</td>
            <td>${metrics.piStar ?? 0}</td>
            <td>${u.joinCode || ""}</td>
            <td>
              <select class="admin-role-select">
                <option value="guest" ${u.role === "guest" ? "selected" : ""}>guest</option>
                <option value="member" ${u.role === "member" ? "selected" : ""}>member</option>
                <option value="associate" ${u.role === "associate" ? "selected" : ""}>associate</option>
                <option value="admin" ${u.role === "admin" ? "selected" : ""}>admin</option>
              </select>
              <button class="btn btn-sm admin-approve-btn">Duyet</button>
              <button class="btn btn-sm admin-reject-btn">Tu choi</button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  renderTable();

  // --- Su kien loc ---
  filterRole.addEventListener("change", renderTable);
  filterStatus.addEventListener("change", renderTable);

  // --- Check all ---
  checkAll.addEventListener("change", () => {
    const checked = checkAll.checked;
    document
      .querySelectorAll(".admin-row-check")
      .forEach((cb) => (cb.checked = checked));
  });

  // --- Duyet hang loat ---
  approveSelectedBtn.addEventListener("click", async () => {
    const checkedRows = Array.from(
      document.querySelectorAll(".admin-row-check:checked")
    );

    if (!checkedRows.length) {
      alert("Hay chon it nhat 1 user de duyet.");
      return;
    }

    if (!confirm(`Duyet ${checkedRows.length} user?`)) return;

    try {
      for (const cb of checkedRows) {
        const tr = cb.closest("tr");
        const uid = tr.dataset.uid;
        const roleSelect = tr.querySelector(".admin-role-select");
        const newRole = roleSelect ? roleSelect.value : "member";

        await approveUser(uid, "approve", newRole);

        // Cap nhat trong allUsers (status, role)
        const target = allUsers.find((u) => u.uid === uid);
        if (target) {
          target.status = "approved";
          target.role = newRole;
        }
      }

      renderTable();
      alert("Da duyet xong cac user da chon.");
    } catch (err) {
      console.error("Loi duyet hang loat:", err);
      alert("Co loi xay ra khi duyet user.");
    }
  });

  // --- Su kien tren tung dong (approve / reject + doi role) ---
  tbody.addEventListener("click", async (e) => {
    const tr = e.target.closest("tr[data-uid]");
    if (!tr) return;
    const uid = tr.dataset.uid;

    if (e.target.classList.contains("admin-approve-btn")) {
      const roleSelect = tr.querySelector(".admin-role-select");
      const newRole = roleSelect ? roleSelect.value : "member";

      try {
        await approveUser(uid, "approve", newRole);
        const target = allUsers.find((u) => u.uid === uid);
        if (target) {
          target.status = "approved";
          target.role = newRole;
        }
        renderTable();
      } catch (err) {
        console.error("Loi approve user:", err);
        alert("Khong duyet duoc user.");
      }
    }

    if (e.target.classList.contains("admin-reject-btn")) {
      if (!confirm("Ban co chac muon tu choi user nay?")) return;
      try {
        await approveUser(uid, "reject");
        const target = allUsers.find((u) => u.uid === uid);
        if (target) {
          target.status = "rejected";
        }
        renderTable();
      } catch (err) {
        console.error("Loi reject user:", err);
        alert("Khong tu choi duoc user.");
      }
    }
  });

  // --- Thay doi role ngay khi chon (khong can duyet) ---
  tbody.addEventListener("change", async (e) => {
    if (!e.target.classList.contains("admin-role-select")) return;

    const tr = e.target.closest("tr[data-uid]");
    if (!tr) return;
    const uid = tr.dataset.uid;
    const newRole = e.target.value;

    try {
      await setUserRole(uid, newRole);
      const target = allUsers.find((u) => u.uid === uid);
      if (target) {
        target.role = newRole;
      }

      // Neu admin dang doi chinh minh thi cap nhat profile tren UI
      if (profile.uid === uid && typeof onProfileUpdate === "function") {
        onProfileUpdate({
          ...profile,
          role: newRole,
        });
      }
    } catch (err) {
      console.error("Loi setUserRole:", err);
      alert("Khong thay doi duoc role.");
    }
  });
}

// Backward-compatible export (mot so file cu import renderAdminView)
export async function renderAdminView(container, firebaseUser, profile, onProfileUpdate) {
  return loadAndRenderAdmin(container, firebaseUser, profile, onProfileUpdate);
}
