// js/ung-dung/ui-theme.js
// Xu ly doi theme light/dark, luu localStorage

const STORAGE_KEY = "fanlab-theme";

// Ham chinh: truyen vao nut toggle, se khoi dong theme
export function initTheme(themeToggleButton) {
  const saved = localStorage.getItem(STORAGE_KEY) || "light";
  applyTheme(saved, themeToggleButton);

  if (!themeToggleButton) return;

  themeToggleButton.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    applyTheme(next, themeToggleButton);
  });
}

// Alias de tranh loi import (neu main.js dang import initThemeToggle)
export function initThemeToggle(themeToggleButton) {
  initTheme(themeToggleButton);
}

function applyTheme(theme, btn) {
  document.body.setAttribute("data-theme", theme);
  if (btn) {
    btn.textContent = `Theme: ${theme === "light" ? "Light" : "Dark"}`;
  }
  localStorage.setItem(STORAGE_KEY, theme);
}

// Backward-compat: mot so phien ban cu cua main.js dung ten export nay.
export const initThemeUI = initTheme;
