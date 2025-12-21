
// main.js
// Entry chinh: ket noi auth + UI + admin

import { subscribeAuthState, loginWithGoogle, logout, authState } from "./js/he-thong/auth.js";
import { renderDashboard } from "./js/ung-dung/ui-dashboard.js";
import { renderJoinGate } from "./js/ung-dung/ui-join.js";
import { loadAndRenderAdmin } from "./js/ung-dung/ui-admin.js";
import { initTheme } from "./js/ung-dung/ui-theme.js";

// Lay cac element DOM chinh
const navDashboard = document.getElementById("nav-dashboard");
const navJoin = document.getElementById("nav-join");
const navAdmin = document.getElementById("nav-admin");

const viewDashboard = document.getElementById("view-dashboard");
const viewJoin = document.getElementById("view-join");
const viewAdmin = document.getElementById("view-admin");

const statusBar = document.getElementById("status-bar");
const dashboardContent = document.getElementById("dashboard-content");
const joinContent = document.getElementById("join-content");

const adminNotice = document.getElementById("admin-notice");
const adminTabs = document.getElementById("admin-tabs");
const adminUsersSection = document.getElementById("admin-users");
const adminReportsSection = document.getElementById("admin-reports");
const tabUsers = document.getElementById("tab-users");
const tabReports = document.getElementById("tab-reports");
const filterRole = document.getElementById("filter-role");
const filterStatus = document.getElementById("filter-status");
const usersTableBody = document.getElementById("users-table-body");
const reportTotal = document.getElementById("report-total");
const reportGuest = document.getElementById("report-guest");
const reportPending = document.getElementById("report-pending");
const reportMember = document.getElementById("report-member");
const reportAdmin = document.getElementById("report-admin");

const themeToggleButton = document.getElementById("theme-toggle");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userNameSpan = document.getElementById("user-name");

// Ham tien ich: chuyen view
function setView(name) {
  viewDashboard.classList.add("hidden");
  viewJoin.classList.add("hidden");
  viewAdmin.classList.add("hidden");

  if (name === "dashboard") viewDashboard.classList.remove("hidden");
  if (name === "join") viewJoin.classList.remove("hidden");
  if (name === "admin") viewAdmin.classList.remove("hidden");

  statusBar.textContent = "";
}

// Khoi tao theme
initTheme(themeToggleButton);

// Su kien navbar
navDashboard.addEventListener("click", () => setView("dashboard"));
navJoin.addEventListener("click", () => setView("join"));
navAdmin.addEventListener("click", () => setView("admin"));

// Su kien login / logout
loginBtn.addEventListener("click", async () => {
  try {
    loginBtn.disabled = true;
    loginBtn.textContent = "Dang dang nhap...";
    await loginWithGoogle();
  } catch (err) {
    console.error(err);
    alert("Dang nhap that bai");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Dang nhap voi Google";
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await logout();
  } catch (err) {
    console.error(err);
  }
});

// Ham set status hien thi o statusBar
function setStatus(message) {
  statusBar.textContent = message || "";
}

// Dang ky lang nghe auth state
subscribeAuthState(async (firebaseUser, profile) => {
  // Cap nhat UI tren navbar
  if (!firebaseUser) {
    userNameSpan.textContent = "";
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    navAdmin.classList.add("hidden");
    setStatus("Ban chua dang nhap.");
  } else {
    userNameSpan.textContent = firebaseUser.displayName || firebaseUser.email || "";
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    setStatus("Dang nhap thanh cong.");
  }

  // Render Dashboard + Cong thanh vien
  renderDashboard(dashboardContent, firebaseUser, profile);
  renderJoinGate(joinContent, firebaseUser, profile, (newProfile) => {
    // Callback khi profile duoc cap nhat tu Join Gate
    authState.profile = newProfile;
    renderDashboard(dashboardContent, firebaseUser, newProfile);
  }, setStatus);

  // Render / kiem tra Admin
  const elements = {
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
  };
  await loadAndRenderAdmin(firebaseUser, profile, elements, setStatus);
});

// View mac dinh
setView("dashboard");
