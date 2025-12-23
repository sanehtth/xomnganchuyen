// main.js
// Diem noi giua auth + UI chinh

import {
  subscribeAuthState,
  loginWithGoogle,
  logout,
} from "./js/he-thong/auth.js";

import { renderDashboardView } from "./js/ung-dung/ui-dashboard.js";
import { renderJoinView } from "./js/ung-dung/ui-join.js";
import { renderAdminView } from "./js/ung-dung/ui-admin.js";
import { initThemeUI } from "./js/ung-dung/ui-theme.js";

// =====================================
// DOM elements
// =====================================

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const statusBar = document.getElementById("status-bar");

const viewDashboard = document.getElementById("view-dashboard");
const viewJoin = document.getElementById("view-join");
const viewAdmin = document.getElementById("view-admin");

const dashboardContent = document.getElementById("dashboard-content");
const joinContent = document.getElementById("join-content");
const adminContent = document.getElementById("admin-content");

const navDashboard = document.getElementById("nav-dashboard");
const navJoin = document.getElementById("nav-join");
const navAdmin = document.getElementById("nav-admin");

// Theme toggle
const themeToggleBtn = document.getElementById("theme-toggle-btn");
initThemeUI(themeToggleBtn);

// Trang landing khi chua dang nhap
function renderLoggedOutLanding() {
  if (!dashboardContent) return;
  dashboardContent.innerHTML = `
    <div class="card">
      <h2>Fanpage Lab</h2>
      <p>Ban chua dang nhap. Hay bam nut "Dang nhap voi Google"
      o tren de vao he thong.</p>
    </div>
  `;
  if (joinContent) joinContent.innerHTML = "";
  if (adminContent) adminContent.innerHTML = "";
  if (statusBar) statusBar.textContent = "Ban chua dang nhap.";
}

// Helper: chuyen tab
function showView(target) {
  const allViews = [viewDashboard, viewJoin, viewAdmin];
  allViews.forEach((v) => {
    if (!v) return;
    v.style.display = v === target ? "block" : "none";
  });
}

// =====================================
// Xu ly Auth
// =====================================

let currentUser = null;
let currentProfile = null;

subscribeAuthState(async (firebaseUser, profile) => {
  currentUser = firebaseUser;
  currentProfile = profile;

  if (!firebaseUser || !profile) {
    // Chua dang nhap -> xoa noi dung nhay cam
    renderLoggedOutLanding();
    if (navAdmin) navAdmin.style.display = "none";
    if (navJoin) navJoin.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "inline-block";
    showView(viewDashboard);
    return;
  }

  if (statusBar) {
    statusBar.textContent = `Dang nhap thanh cong. Xin chao, ${
      profile.displayName || firebaseUser.email
    }.`;
  }

  // Nut login / logout
  if (loginBtn) loginBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "inline-block";

  // Dashboard luon co
  if (dashboardContent) {
    renderDashboardView(dashboardContent, firebaseUser, profile);
    showView(viewDashboard);
  }

  // Tab Cong thanh vien
  if (joinContent && navJoin) {
    renderJoinView(joinContent, firebaseUser, profile);
    navJoin.style.display = "inline-block";
  }

  // Tab Admin chi hien neu role === 'admin'
  if (navAdmin) {
    if (profile.role === "admin") {
      navAdmin.style.display = "inline-block";
      if (viewAdmin && adminContent) {
        await renderAdminView(adminContent, firebaseUser);
      }
    } else {
      navAdmin.style.display = "none";
      if (adminContent) {
        adminContent.innerHTML = "";
      }
    }
  }
});

// =====================================
// Event listeners
// =====================================

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

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      logoutBtn.disabled = true;
      await logout();

      // Sau khi logout -> ve landing an toan
      renderLoggedOutLanding();
      if (navAdmin) navAdmin.style.display = "none";
      if (navJoin) navJoin.style.display = "none";
      if (loginBtn) loginBtn.style.display = "inline-block";
      showView(viewDashboard);
    } catch (err) {
      console.error(err);
    } finally {
      logoutBtn.disabled = false;
    }
  });
}

// Chuyen tab
if (navDashboard) {
  navDashboard.addEventListener("click", () => {
    showView(viewDashboard);
  });
}

if (navJoin) {
  navJoin.addEventListener("click", () => {
    showView(viewJoin);
  });
}

if (navAdmin) {
  navAdmin.addEventListener("click", () => {
    showView(viewAdmin);
    if (currentUser && adminContent) {
      renderAdminView(adminContent, currentUser);
    }
  });
}

// Khoi dong lan dau
renderLoggedOutLanding();
