import { useContext } from "react";
import { ThemeContext } from "../theme.jsx";
import { AuthContext } from "../AuthContext.jsx";
import { logout } from "../firebase";

// DÙNG DEFAULT EXPORT
export default function Navbar() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, isAdmin } = useContext(AuthContext);

  return (
    <header className="max-w">
      <div className="nav">
        <div className="nav-left">
          <div style={{ fontWeight: 700 }}>Fanpage Lab</div>
          <span className="badge">beta</span>
        </div>

        <div className="flex gap-2 items-center">
          {/* Chỉ admin mới thấy nút Admin tools */}
          {isAdmin && (
            <a className="btn outline" href="/admin-tools">
              Admin tools
            </a>
          )}

          {/* Đổi theme */}
          <button className="btn outline" onClick={toggleTheme}>
            {theme === "light" ? "Dark" : "Light"}
          </button>

          {/* Logout khi đã đăng nhập */}
          {user && (
            <button className="btn outline" onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
