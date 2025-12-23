// /main.js
// Entry point SPA - điều phối UI + Auth + routing

import { initAuth, loginWithGoogle, logout } from "./js/he-thong/auth.js";
import { initThemeUI } from "./js/ung-dung/ui-theme.js";
import { renderDashboardView } from "./js/ung-dung/ui-dashboard.js";
import { renderJoinView } from "./js/ung-dung/ui-join.js";
import { renderAdminView } from "./js/ung-dung/ui-admin.js";

const $ = (sel) => document.querySelector(sel);

const state = {
  user: null,        // firebase auth user
  profile: null,     // Firestore profile (users/{uid})
};

function setNavAuthUI(isSignedIn) {
  const btnLogin = $("#btnLoginGoogle");
  const btnLogout = $("#btnLogout");
  if (btnLogin) btnLogin.style.display = isSignedIn ? "none" : "";
  if (btnLogout) btnLogout.style.display = isSignedIn ? "" : "none";
}

function setNavUserUI(profile) {
  const nameEl = $("#navUserName");
  if (nameEl) nameEl.textContent = profile?.displayName || profile?.email || "";
}

function setAdminNavVisible(profile) {
  const adminLink = $("#navAdmin");
  if (!adminLink) return;
  const isAdmin = (profile?.role || "").toLowerCase() === "admin";
  adminLink.style.display = isAdmin ? "" : "none";
}

function getRoute() {
  // dùng hash: #/dashboard, #/join, #/admin
  const h = (location.hash || "#/dashboard").trim();
  if (h.startsWith("#/admin")) return "admin";
  if (h.startsWith("#/join")) return "join";
  return "dashboard";
}

async function renderRoute() {
  const route = getRoute();

  const viewDashboard = $("#viewDashboard");
  const viewJoin = $("#viewJoin");
  const viewAdmin = $("#viewAdmin");

  // Ẩn tất cả
  [viewDashboard, viewJoin, viewAdmin].forEach((el) => {
    if (el) el.style.display = "none";
  });

  // Chưa đăng nhập -> chỉ cho xem dashboard dạng guest (nếu UI hỗ trợ)
  if (!state.user) {
    if (viewDashboard) {
      viewDashboard.style.display = "";
      await renderDashboardView(viewDashboard, null, null);
    }
    return;
  }

  // Đã đăng nhập
  if (route === "admin") {
    if (viewAdmin) {
      viewAdmin.style.display = "";
      await renderAdminView(viewAdmin, state.user, state.profile);
    }
    return;
  }

  if (route === "join") {
    if (viewJoin) {
      viewJoin.style.display = "";
      await renderJoinView(viewJoin, state.user, state.profile);
    }
    return;
  }

  // dashboard
  if (viewDashboard) {
    viewDashboard.style.display = "";
    await renderDashboardView(viewDashboard, state.user, state.profile);
  }
}

function bindNav() {
  const btnLogin = $("#btnLoginGoogle");
  if (btnLogin) {
    btnLogin.addEventListener("click", async () => {
      await loginWithGoogle();
    });
  }

  const btnLogout = $("#btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      await logout();
    });
  }

  window.addEventListener("hashchange", () => {
    renderRoute().catch(console.error);
  });
}

async function bootstrap() {
  // Theme
  initThemeUI?.();

  bindNav();

  // Auth init
  initAuth({
    onSignedOut: async () => {
      state.user = null;
      state.profile = null;
      setNavAuthUI(false);
      setNavUserUI(null);
      setAdminNavVisible(null);
      await renderRoute();
    },
    onSignedIn: async ({ user, profile }) => {
      state.user = user;
      state.profile = profile || null;
      setNavAuthUI(true);
      setNavUserUI(state.profile);
      setAdminNavVisible(state.profile);
      await renderRoute();
    },
    onProfileUpdated: async (profile) => {
      // nếu admin đổi role/status, nav cần cập nhật
      state.profile = profile || state.profile;
      setNavUserUI(state.profile);
      setAdminNavVisible(state.profile);
    },
  });

  // Render lần đầu
  await renderRoute();
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
});
