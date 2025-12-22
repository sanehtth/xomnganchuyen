// main.js
// Điểm nối giữa auth + UI

import { subscribeAuthState, loginWithGoogle, logout, authState } from "./js/he-thong/auth.js";
import { renderDashboard } from "./js/ung-dung/ui-dashboard.js";
import { renderJoinGate } from "./js/ung-dung/ui-join.js";
import { loadAndRenderAdmin } from "./js/ung-dung/ui-admin.js";
import { initThemeToggle } from "./js/ung-dung/ui-theme.js";

// ========================
// DOM elements
// ========================

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userNameSpan = document.getElementById("user-name");
const statusBar = document.getElementById("status-bar");

const dashboardContent = document.getElementById("dashboard-content");
const joinContent = document.getElementById("join-content");
const adminContent = document.getElementById("admin-content");

const navDashboard = document.getElementById("nav-dashboard");
const navJoin = document.getElementById("nav-join");
const navAdmin = document.getElementById("nav-admin");

const viewDashboard = document.getElementById("view-dashboard");
const viewJoin = document.getElementById("view-join");
const viewAdmin = document.getElementById("view-admin");

// ========================
// Helper: chuyển tab
// ========================

function showView(target) {
  const allViews = [viewDashboard, viewJoin, viewAdmin];
  allViews.forEach((v) => {
    if (!v) return;
    v.style.display = v === target ? "block" : "none";
  });

  const navItems = [navDashboard, navJoin, navAdmin];
  navItems.forEach((el) => {
    if (!el) return;
    el.classList.remove("active");
  });

  if (target === viewDashboard && navDashboard) navDashboard.classList.add("active");
  if (target === viewJoin && navJoin) navJoin.classList.add("active");
  if (target === viewAdmin && navAdmin) navAdmin.classList.add("active");
}

// ========================
// Xử lý login / logout button
// ========================

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    loginBtn.disabled = true;
    statusBar.textContent = "Đang đăng nhập...";

    try {
      await loginWithGoogle();
      // onAuthStateChanged sẽ render lại UI
    } catch (err) {
      alert("Đăng nhập thất bại, thử lại sau.");
      console.error(err);
    } finally {
      loginBtn.disabled = false;
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    statusBar.textContent = "Đang đăng xuất...";

    try {
      await logout();
      // Sau khi logout, trạng thái sẽ về null trong subscribeAuthState
    } catch (err) {
      alert("Lỗi khi đăng xuất.");
      console.error(err);
    } finally {
      logoutBtn.disabled = false;
    }
  });
}

// ========================
// Lắng nghe auth + render UI
// ========================

subscribeAuthState((firebaseUser, profile) => {
  // Không đăng nhập
  if (!firebaseUser || !profile) {
    if (userNameSpan) userNameSpan.textContent = "";
    if (statusBar) statusBar.textContent = "Bạn chưa đăng nhập.";

    if (loginBtn) loginBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";

    // Ẩn tab join + admin khi chưa login
    if (navJoin) navJoin.style.display = "none";
    if (navAdmin) navAdmin.style.display = "none";

    if (viewJoin) viewJoin.style.display = "none";
    if (viewAdmin) viewAdmin.style.display = "none";

    // Dashboard ở trạng thái khách
    if (dashboardContent) {
      dashboardContent.innerHTML = "<p>Đang tải...</p>";
      renderDashboard(dashboardContent, null, null);
    }

    // Điều hướng về Dashboard (có thể đổi thành trang giới thiệu riêng nếu muốn)
    if (viewDashboard) showView(viewDashboard);

    return;
  }

  // Đã đăng nhập
  if (userNameSpan) userNameSpan.textContent = profile.displayName || firebaseUser.email || "User";
  if (statusBar) statusBar.textContent = "Đăng nhập thành công.";

  if (loginBtn) loginBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "inline-block";

  // Hiện tab join cho tất cả user
  if (navJoin) navJoin.style.display = "inline-block";

  // Admin mới thấy tab admin
  const isAdmin = profile.role === "admin";
  if (navAdmin) {
    navAdmin.style.display = isAdmin ? "inline-block" : "none";
  }

  // Render Dashboard
  if (dashboardContent) {
    dashboardContent.innerHTML = "<p>Đang tải...</p>";
    renderDashboard(dashboardContent, firebaseUser, profile);
  }

  // Render Join page
  if (joinContent) {
    joinContent.innerHTML = "<p>Đang tải...</p>";
    renderJoinGate(joinContent, firebaseUser, profile);
  }

  // Render Admin nếu là admin
  if (isAdmin && adminContent) {
    adminContent.innerHTML = "<p>Đang tải danh sách người dùng...</p>";
    loadAndRenderAdmin(adminContent, firebaseUser, profile);
  } else if (adminContent) {
    adminContent.innerHTML = "<p>Bạn không có quyền admin.</p>";
  }

  // Sau login thì về Dashboard
  if (viewDashboard) showView(viewDashboard);
});

// ========================
// Điều hướng click trên navbar
// ========================

if (navDashboard && viewDashboard) {
  navDashboard.addEventListener("click", (e) => {
    e.preventDefault();
    showView(viewDashboard);
  });
}

if (navJoin && viewJoin) {
  navJoin.addEventListener("click", (e) => {
    e.preventDefault();
    showView(viewJoin);
  });
}

if (navAdmin && viewAdmin) {
  navAdmin.addEventListener("click", (e) => {
    e.preventDefault();
    showView(viewAdmin);
  });
}

// ========================
// Theme toggle
// ========================

initThemeToggle();
