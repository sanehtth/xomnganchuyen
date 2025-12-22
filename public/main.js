// public/main.js
// Điểm nối giữa auth + UI + admin

import {
  subscribeAuthState,
  loginWithGoogle,
  logout,
} from "./js/he-thong/auth.js";

import { renderDashboard } from "./js/ung-dung/ui-dashboard.js";
import { renderJoinGate } from "./js/ung-dung/ui-join.js";
import { loadAndRenderAdmin } from "./js/ung-dung/ui-admin.js";
import { initTheme } from "./js/ung-dung/ui-theme.js";
import { getUiAccountStatus } from "./js/data/userData.js";

// -------------------------
// Hook DOM elements
// -------------------------

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const navDashboard = document.getElementById("nav-dashboard");
const navJoin = document.getElementById("nav-join");
const navAdmin = document.getElementById("nav-admin");

const dashboardContent = document.getElementById("dashboard-content");
const joinContent = document.getElementById("join-content");
const adminContent = document.getElementById("admin-content");

const themeToggleButton = document.getElementById("theme-toggle");

// -------------------------
// Helper: chuyển tab
// -------------------------
function showView(target) {
  const allViews = [dashboardContent, joinContent, adminContent];
  allViews.forEach((v) => {
    if (!v) return;
    v.style.display = v === target ? "block" : "none";
  });
}

// -------------------------
// Gắn sự kiện nav
// -------------------------

if (navDashboard) {
  navDashboard.addEventListener("click", (e) => {
    e.preventDefault();
    showView(dashboardContent);
  });
}

if (navJoin) {
  navJoin.addEventListener("click", (e) => {
    e.preventDefault();
    showView(joinContent);
  });
}

if (navAdmin) {
  navAdmin.addEventListener("click", async (e) => {
    e.preventDefault();
    showView(adminContent);
    // Mỗi lần bấm tab Admin thì load lại danh sách
    await loadAndRenderAdmin();
  });
}

// -------------------------
// Gắn sự kiện login / logout
// -------------------------

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    try {
      loginBtn.disabled = true;
      loginBtn.textContent = "Đang đăng nhập...";
      await loginWithGoogle();
      // subscribeAuthState sẽ tự render lại UI
    } catch (err) {
      console.error(err);
      alert("Đăng nhập thất bại");
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Đăng nhập với Google";
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      logoutBtn.disabled = true;
      logoutBtn.textContent = "Đang đăng xuất...";
      await logout();
      // Sau khi logout, quay về trạng thái khách: ẩn nội dung, hiện nút login
      renderLoggedOut();
    } catch (err) {
      console.error(err);
      alert("Đăng xuất thất bại");
    } finally {
      logoutBtn.disabled = false;
      logoutBtn.textContent = "Đăng xuất";
    }
  });
}

// -------------------------
// Render khi CHƯA đăng nhập
// -------------------------
function renderLoggedOut() {
  // Ẩn toàn bộ view chính
  if (dashboardContent) dashboardContent.style.display = "none";
  if (joinContent) joinContent.style.display = "none";
  if (adminContent) adminContent.style.display = "none";

  // Ẩn tab admin, tab cộng thành viên vẫn có thể xem giới thiệu
  if (navAdmin) navAdmin.style.display = "none";

  // Hiện nút đăng nhập
  if (loginBtn) loginBtn.style.display = "inline-block";
  if (logoutBtn) logoutBtn.style.display = "none";

  // Có thể gắn thêm redirect sang trang giới thiệu ở đây nếu muốn.
}

// -------------------------
// Render khi ĐÃ đăng nhập
// -------------------------
function renderLoggedIn(firebaseUser, profile) {
  const uiStatus = getUiAccountStatus(profile); // normal | pending | banned

  // Hiện nội dung Dashboard mặc định
  if (dashboardContent) {
    dashboardContent.style.display = "block";
  }
  if (joinContent) joinContent.style.display = "none";

  // Admin tab chỉ hiện nếu role = admin
  if (navAdmin) {
    navAdmin.style.display = profile.role === "admin" ? "inline-block" : "none";
  }

  // Đổi nút login/logout
  if (loginBtn) loginBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "inline-block";

  // Render Dashboard
  renderDashboard(dashboardContent, firebaseUser, profile, uiStatus);

  // Render trang Cộng thành viên
  renderJoinGate(
    joinContent,
    firebaseUser,
    profile,
    uiStatus,
    // onProfileUpdate
    (updatedProfile) => {
      renderDashboard(dashboardContent, firebaseUser, updatedProfile, getUiAccountStatus(updatedProfile));
    }
  );

  // Nếu là admin thì tải luôn dữ liệu admin lần đầu
  if (profile.role === "admin") {
    loadAndRenderAdmin();
  }
}

// -------------------------
// Khởi động hệ thống
// -------------------------

// 1. Khởi tạo theme (light/dark)
initTheme(themeToggleButton);

// 2. Lắng nghe auth state
subscribeAuthState(async (firebaseUser, profile) => {
  if (!firebaseUser || !profile) {
    renderLoggedOut();
    return;
  }
  renderLoggedIn(firebaseUser, profile);
});
