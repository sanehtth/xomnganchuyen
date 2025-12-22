// public/js/ung-dung/ui-theme.js
// Quản lý theme Light / Dark cho toàn bộ web.

// KEY lưu theme trong localStorage
const THEME_KEY = "fanpage-theme";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";

// Áp dụng theme vào DOM + cập nhật label của nút
function applyTheme(theme, buttonElement) {
  const safeTheme = theme === THEME_DARK ? THEME_DARK : THEME_LIGHT;

  // Gắn attribute cho <html> để CSS dùng [data-theme="dark"]
  document.documentElement.setAttribute("data-theme", safeTheme);

  // Đổi text nút nếu có
  if (buttonElement) {
    buttonElement.textContent =
      safeTheme === THEME_DARK ? "Theme: Dark" : "Theme: Light";
  }
}

// Đọc theme từ localStorage
function loadTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === THEME_LIGHT || stored === THEME_DARK) {
      return stored;
    }
  } catch (err) {
    console.warn("Không đọc được theme từ localStorage:", err);
  }
  return THEME_LIGHT;
}

// Lưu theme
function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (err) {
    console.warn("Không lưu được theme vào localStorage:", err);
  }
}

// Hàm khởi tạo theme – HÀM CHÍNH DÙNG CHO APP
export function initTheme(themeToggleButton) {
  // 1. Áp dụng theme hiện tại (hoặc default = light)
  const currentTheme = loadTheme();
  applyTheme(currentTheme, themeToggleButton);

  // 2. Nếu không có nút trên DOM thì thôi
  if (!themeToggleButton) return;

  // 3. Gắn sự kiện click để toggle theme
  themeToggleButton.addEventListener("click", () => {
    const current = loadTheme();
    const nextTheme = current === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;

    saveTheme(nextTheme);
    applyTheme(nextTheme, themeToggleButton);
  });
}

// Alias cho các code cũ lỡ dùng tên `initThemeToggle`
// => Dù import initTheme hay initThemeToggle đều chạy được.
export function initThemeToggle(themeToggleButton) {
  initTheme(themeToggleButton);
}
