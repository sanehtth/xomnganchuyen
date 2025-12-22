// main.js
// Điểm nối giữa auth (Firebase) và UI (index.html)

import {
  subscribeAuthState,
  loginWithGoogle,
  logout,
} from "./js/he-thong/auth.js";

import { renderDashboard } from "./js/ung-dung/ui-dashboard.js";
import { renderJoinGate } from "./js/ung-dung/ui-join.js";
import { loadAndRenderAdmin } from "./js/ung-dung/ui-admin.js";
import { initTheme } from "./js/ung-dung/ui-theme.js";

// ============================
// Lấy element theo đúng id trong index.html
// ============================

const navDashboard = document.getElementById("nav-dashboard");
const navJoin = document.getElementById("nav-join");
const navAdmin = document.getElementById("nav-admin");

const themeToggleBtn = document.getElementById("theme-toggle");

const userInfoBox = document.getElementById("user-info");
const userNameSpan = document.getElementById("user-name");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

const statusBar = document.getElementById("status-bar");

const viewDashboard = document.getElementById("view-dashboard");
const viewJoin = document.getElementById("view-join");
const viewAdmin = document.getElementById("view-admin");

const dashboardContent = document.getElementById("dashboard-content");
const joinContent = document.getElementById("join-content");
const adminNotice = document.getElementById("admin-notice");
const adminTabs = document.getElementById("admin-tabs");
const adminContentUsers = document.getElementById("admin-users");
const adminContentReports = document.getElementById("admin-reports");
const adminContent = document.getElementById("admin-users"); // container chính cho loadAndRenderAdmin

// Khởi tạo theme nếu có nút
if (themeToggleBtn) {
  initTheme(themeToggleBtn);
}

// ============================
// Helper UI
// ============================

function setHidden(el, hidden) {
  if (!el) return;
  if (hidden) el.classList.add("hidden");
  else el.classList.remove("hidden");
}

// Chuyển giữa các view chính
function showView(view) {
  const all = [viewDashboard, viewJoin, viewAdmin];
  all.forEach((v) => setHidden(v, v !== view));
}

// Trạng thái landing khi chưa đăng nhập
function renderLoggedOutLanding() {
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <p>Dang tai...</p>
    `;
  }
  if (joinContent) joinContent.innerHTML = `<p>Dang tai...</p>`;
  if (adminNotice) adminNotice.innerHTML = "";
  if (adminTabs) adminTabs.classList.add("hidden");
  if (adminContentUsers) adminContentUsers.innerHTML = "";
  if (adminContentReports) adminContentReports.innerHTML = "";

  if (statusBar) {
    statusBar.textContent = "";
  }

  // Navi + nút
  setHidden(navJoin, false); // nếu muốn ẩn khi chưa login thì đổi thành true
  setHidden(navAdmin, true);

  setHidden(loginBtn, false);
  setHidden(logoutBtn, true);
  if (userNameSpan) userNameSpan.textContent = "";

  showView(viewDashboard);
}

// ============================
// State hiện tại
// ============================

let currentUser = null;
let currentProfile = null;

// Khi cần render lại toàn UI dựa trên user/profile
function rerenderAllViews() {
  if (!currentUser || !currentProfile) {
    renderLoggedOutLanding();
    return;
  }

  // Dashboard
  if (dashboardContent) {
    renderDashboard(dashboardContent, currentUser, currentProfile);
  }

  // Cổng thành viên
  if (joinContent) {
    renderJoinGate(joinContent, currentUser, currentProfile);
  }

  // Nếu đang đứng ở view admin thì vẽ lại admin
  if (!viewAdmin.classList.contains("hidden") && adminContentUsers) {
    loadAndRenderAdmin(
      adminContentUsers,
      currentUser,
      currentProfile,
      (newProfile) => {
        currentProfile = newProfile;
        rerenderAllViews();
      }
    );
  }
}

// ============================
// Lắng nghe Auth
// ============================

subscribeAuthState(async (firebaseUser, profile) => {
  currentUser = firebaseUser;
  currentProfile = profile;

  if (!firebaseUser || !profile) {
    // Chưa đăng nhập hoặc lỗi lấy profile
    renderLoggedOutLanding();
    return;
  }

  // Cập nhật status bar
  if (statusBar) {
    statusBar.textContent = `Dang nhap thanh cong. Xin chao, ${
      profile.displayName || firebaseUser.email
    }.`;
  }

  // Nút login/logout + tên user
  setHidden(loginBtn, true);
  setHidden(logoutBtn, false);

  if (userNameSpan) {
    userNameSpan.textContent = profile.displayName || firebaseUser.email || "";
  }

  // Render Dashboard
  if (dashboardContent) {
    renderDashboard(dashboardContent, firebaseUser, profile);
  }

  // Render Cổng thành viên
  if (joinContent) {
    renderJoinGate(joinContent, firebaseUser, profile);
  }

  // Hiện nút "Cổng thành viên"
  setHidden(navJoin, false);

  // Nút Admin chỉ hiện nếu role === admin
  if (profile.role === "admin") {
    setHidden(navAdmin, false);

    // preload admin (không bắt buộc, nhưng tiện)
    if (adminContentUsers) {
      await loadAndRenderAdmin(
        adminContentUsers,
        firebaseUser,
        profile,
        (newProfile) => {
          currentProfile = newProfile;
          rerenderAllViews();
        }
      );
    }
  } else {
    setHidden(navAdmin, true);
  }

  // Mặc định chuyển về Dashboard sau login
  showView(viewDashboard);
});

// ============================
// Event listeners
// ============================

// Đăng nhập
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    try {
      loginBtn.disabled = true;
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      alert("Dang nhap that bai, vui long thu lai.");
    } finally {
      loginBtn.disabled = false;
    }
  });
}

// Đăng xuất
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      logoutBtn.disabled = true;
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      logoutBtn.disabled = false;
      // Đưa UI về trạng thái chưa đăng nhập
      renderLoggedOutLanding();
    }
  });
}

// Chuyển tab Dashboard
if (navDashboard) {
  navDashboard.addEventListener("click", () => {
    showView(viewDashboard);
    if (currentUser && currentProfile) {
      renderDashboard(dashboardContent, currentUser, currentProfile);
    }
  });
}

// Chuyển tab Cổng thành viên
if (navJoin) {
  navJoin.addEventListener("click", () => {
    showView(viewJoin);
    if (currentUser && currentProfile && joinContent) {
      renderJoinGate(joinContent, currentUser, currentProfile);
    }
  });
}

// Chuyển tab Admin
if (navAdmin) {
  navAdmin.addEventListener("click", () => {
    showView(viewAdmin);

    if (adminNotice) adminNotice.classList.add("hidden");
    if (adminTabs) adminTabs.classList.remove("hidden");

    if (currentUser && currentProfile && adminContentUsers) {
      loadAndRenderAdmin(
        adminContentUsers,
        currentUser,
        currentProfile,
        (newProfile) => {
          currentProfile = newProfile;
          rerenderAllViews();
        }
      );
    }
  });
}

// Khởi động lần đầu ở trạng thái chưa login
renderLoggedOutLanding();
