// js/ung-dung/ui-theme.js
// Xu ly doi theme light/dark, luu localStorage

const STORAGE_KEY = "fanlab-theme";

export function initTheme(themeToggleButton) {
  const saved = localStorage.getItem(STORAGE_KEY) || "light";
  applyTheme(saved, themeToggleButton);

  themeToggleButton.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    applyTheme(next, themeToggleButton);
  });
}

function applyTheme(theme, btn) {
  document.body.setAttribute("data-theme", theme);
  if (btn) {
    btn.textContent = `Theme: ${theme === "light" ? "Light" : "Dark"}`;
  }
  localStorage.setItem(STORAGE_KEY, theme);
}
