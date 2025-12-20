// src/components/Navbar.jsx
import { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../theme.jsx";
import { AuthContext } from "../AuthContext.jsx";
import { logout } from "../firebase";

export default function Navbar() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, isAdmin } = useContext(AuthContext);

  return (
    <header className="max-w">
      <div className="nav">
        <div className="nav-left">
          <Link
            to="/"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div style={{ fontWeight: 700 }}>Fanpage Lab</div>
          </Link>
          <span className="badge">beta</span>
        </div>

        <div className="flex gap-2 items-center">
          {/* Chỉ admin mới thấy nút Admin tools */}
          {isAdmin && (
            <Link className="btn outline" to="/admin/users">
              Admin tools
            </Link>
          )}

          {/* Đổi theme */}
          <button className="btn outline" onClick={toggleTheme}>
            {theme === "light" ? "Dark" : "Light"}
          </button>

          {/* Nếu đã login -> Logout, chưa login -> Đăng nhập */}
          {user ? (
            <button className="btn outline" onClick={logout}>
              Logout
            </button>
          ) : (
            <Link className="btn outline" to="/login">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
