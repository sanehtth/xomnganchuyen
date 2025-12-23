// public/main.js
// Entry point SPA: routing UI + Auth
import { subscribeAuthState, loginWithGoogle, logout } from "./js/he-thong/auth.js";
import { initThemeUI } from "./js/ung-dung/ui-theme.js";
import { renderDashboardView } from "./js/ung-dung/ui-dashboard.js";
import { renderJoinView } from "./js/ung-dung/ui-join.js";
import { renderAdminView } from "./js/ung-dung/ui-admin.js";

const $ = (id) => document.getElementById(id);

const state = {
  user: null,
  profile: null,
};

function setNavAuthUI(isSignedIn) {
  const btnLogin = $("login-google-btn");
  const btnLogout = $("logout-btn");
  if (btnLogin) btnLogin.style.display = isSignedIn ? "none" : "";
  if (btnLogout) btnLogout.style.display = isSignedIn ? "" : "none";
}

function setNavUser(profile) {
  const nameEl = $("nav-username");
  if (nameEl) nameEl.textContent = profile?.displayName || "";
}

function setAdminLink(profile) {
  const navAdmin = $("nav-admin");
  if (!navAdmin) return;
  const isAdmin = (profile?.role || "").toLowerCase() === "admin";
  navAdmin.style.display = isAdmin ? "" : "none";
}

function getRoute() {
  const h = (location.hash || "#/dashboard").trim();
  if (h.startsWith("#/admin")) return "admin";
  if (h.startsWith("#/join")) return "join";
  return "dashboard";
}

function showView(route) {
  const vDash = $("view-dashboard");
  const vJoin = $("view-join");
  const vAdmin = $("view-admin");
  if (vDash) vDash.style.display = route === "dashboard" ? "" : "none";
  if (vJoin) vJoin.style.display = route === "join" ? "" : "none";
  if (vAdmin) vAdmin.style.display = route === "admin" ? "" : "none";

  if (route === "dashboard") renderDashboardView({ container: vDash, firebaseUser: state.user, profile: state.profile });
  if (route === "join") renderJoinView({ container: vJoin, firebaseUser: state.user, profile: state.profile });
  if (route === "admin") renderAdminView({ container: vAdmin, firebaseUser: state.user, profile: state.profile });
}

function bindNav() {
  $("nav-dashboard")?.addEventListener("click", (e) => { e.preventDefault(); location.hash = "#/dashboard"; });
  $("nav-join")?.addEventListener("click", (e) => { e.preventDefault(); location.hash = "#/join"; });
  $("nav-admin")?.addEventListener("click", (e) => { e.preventDefault(); location.hash = "#/admin"; });

  window.addEventListener("hashchange", () => showView(getRoute()));
}

function bindAuthButtons() {
  $("login-google-btn")?.addEventListener("click", async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      alert("Đăng nhập thất bại.");
    }
  });

  $("logout-btn")?.addEventListener("click", async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  });
}

function bootstrap() {
  initThemeUI();
  bindNav();
  bindAuthButtons();

  // Auth subscription
  subscribeAuthState((firebaseUser, profile) => {
    state.user = firebaseUser;
    state.profile = profile;

    setNavAuthUI(!!firebaseUser);
    setNavUser(profile);
    setAdminLink(profile);

    showView(getRoute());
  });

  // initial
  showView(getRoute());
}

bootstrap();
