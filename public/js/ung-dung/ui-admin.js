
// js/ung-dung/ui-admin.js
// Giao dien Admin: quan ly user + bao cao

import {
  fetchAllUsers,
  computeUserCounts,
} from "../data/statsData.js";
import {
  approveMembership,
  rejectMembership,
} from "../data/membershipData.js";
import { updateUserProfile } from "../data/userData.js";

export async function loadAndRenderAdmin(
  firebaseUser,
  profile,
  elements,
  setStatus
) {
  const {
    navAdmin,
    adminNotice,
    adminTabs,
    adminUsersSection,
    adminReportsSection,
    tabUsers,
    tabReports,
    filterRole,
    filterStatus,
    usersTableBody,
    reportTotal,
    reportGuest,
    reportPending,
    reportMember,
    reportAdmin,
  } = elements;

  // Kiem tra quyen
  if (!firebaseUser) {
    navAdmin.classList.add("hidden");
    adminNotice.classList.remove("hidden");
    adminNotice.textContent = "Ban can dang nhap.";
    adminTabs.classList.add("hidden");
    adminUsersSection.classList.add("hidden");
    adminReportsSection.classList.add("hidden");
    return;
  }

  if (!profile || profile.role !== "admin") {
    navAdmin.classList.add("hidden");
    adminNotice.classList.remove("hidden");
    adminNotice.textContent = "Ban khong co quyen truy cap admin.";
    adminTabs.classList.add("hidden");
    adminUsersSection.classList.add("hidden");
    adminReportsSection.classList.add("hidden");
    return;
  }

  // Neu la admin hop le
  navAdmin.classList.remove("hidden");
  adminNotice.classList.add("hidden");
  adminTabs.classList.remove("hidden");
  adminUsersSection.classList.remove("hidden");
  adminReportsSection.classList.add("hidden");
  tabUsers.classList.add("tab-button-active");
  tabReports.classList.remove("tab-button-active");

  // Load danh sach user
  let allUsers = [];
  async function reloadUsers() {
    allUsers = await fetchAllUsers();
    renderUsersTable();
    renderReports();
  }

  function renderUsersTable() {
    if (!Array.isArray(allUsers) || allUsers.length === 0) {
      usersTableBody.innerHTML =
        '<tr><td colspan="12">Chua co user nao.</td></tr>';
      return;
    }

    const roleFilter = filterRole.value;
    const statusFilter = filterStatus.value;

    const filtered = allUsers.filter((u) => {
      const role = u.role || "guest";
      const status = u.status || "none";
      if (roleFilter !== "all" && role !== roleFilter) return false;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      return true;
    });

    if (filtered.length === 0) {
      usersTableBody.innerHTML =
        '<tr><td colspan="12">Khong co user nao khop bo loc.</td></tr>';
      return;
    }

    usersTableBody.innerHTML = "";

    filtered.forEach((u) => {
      const metrics = u.metrics || {};
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.email || ""}</td>
        <td>${u.displayName || ""}</td>
        <td>${u.role || "guest"}</td>
        <td>${u.status || "none"}</td>
        <td>${u.xp ?? 0}</td>
        <td>${u.coin ?? 0}</td>
        <td>${u.level ?? 1}</td>
        <td>${metrics.fi ?? 0}</td>
        <td>${metrics.pi ?? 0}</td>
        <td>${metrics.piStar ?? 0}</td>
        <td>${u.joinCode || ""}</td>
        <td>
          <div class="admin-actions">
            <button class="btn btn-secondary btn-approve" data-uid="${u.uid}">
              Duyet
            </button>
            <button class="btn btn-secondary btn-reject" data-uid="${u.uid}">
              Tu choi
            </button>
            <select class="role-select" data-uid="${u.uid}">
              <option value="guest" ${(u.role || "guest") === "guest" ? "selected" : ""}>guest</option>
              <option value="member" ${u.role === "member" ? "selected" : ""}>member</option>
              <option value="associate" ${u.role === "associate" ? "selected" : ""}>associate</option>
              <option value="admin" ${u.role === "admin" ? "selected" : ""}>admin</option>
            </select>
          </div>
        </td>
      `;
      usersTableBody.appendChild(tr);
    });

    // Su kien cho cac nut / select
    usersTableBody.querySelectorAll(".btn-approve").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const uid = e.target.getAttribute("data-uid");
        const joinCode = prompt("Nhap join code (co the de trong):", "");
        await approveMembership(uid, "member", joinCode || "");
        setStatus("Da duyet user.");
        await reloadUsers();
      });
    });

    usersTableBody.querySelectorAll(".btn-reject").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const uid = e.target.getAttribute("data-uid");
        await rejectMembership(uid);
        setStatus("Da tu choi user.");
        await reloadUsers();
      });
    });

    usersTableBody.querySelectorAll(".role-select").forEach((sel) => {
      sel.addEventListener("change", async (e) => {
        const uid = e.target.getAttribute("data-uid");
        const role = e.target.value;
        await updateUserProfile(uid, { role });
        setStatus("Da cap nhat role user.");
        await reloadUsers();
      });
    });
  }

  function renderReports() {
    const counts = computeUserCounts(allUsers);
    reportTotal.textContent = counts.total;
    reportGuest.textContent = counts.guest;
    reportPending.textContent = counts.pending;
    reportMember.textContent = counts.member;
    reportAdmin.textContent = counts.admin;
  }

  // Su kien tab
  tabUsers.addEventListener("click", () => {
    tabUsers.classList.add("tab-button-active");
    tabReports.classList.remove("tab-button-active");
    adminUsersSection.classList.remove("hidden");
    adminReportsSection.classList.add("hidden");
  });

  tabReports.addEventListener("click", () => {
    tabReports.classList.add("tab-button-active");
    tabUsers.classList.remove("tab-button-active");
    adminUsersSection.classList.add("hidden");
    adminReportsSection.classList.remove("hidden");
    renderReports();
  });

  filterRole.addEventListener("change", renderUsersTable);
  filterStatus.addEventListener("change", renderUsersTable);

  // Load lan dau
  await reloadUsers();
}
