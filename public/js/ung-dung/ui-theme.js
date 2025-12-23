// public/js/ung-dung/ui-theme.js
export function initThemeUI() {
  const btn = document.getElementById("theme-toggle-btn");
  const label = document.getElementById("theme-label");
  if (!btn) return;

  const apply = (mode) => {
    document.documentElement.dataset.theme = mode;
    if (label) label.textContent = mode === "dark" ? "Theme: Dark" : "Theme: Light";
  };

  const current = localStorage.getItem("theme") || "light";
  apply(current);

  btn.addEventListener("click", () => {
    const next = (localStorage.getItem("theme") || "light") === "light" ? "dark" : "light";
    localStorage.setItem("theme", next);
    apply(next);
  });
}
