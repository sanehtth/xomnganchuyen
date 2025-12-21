// ví dụ trong Navbar.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useTheme } from "../theme"; // nếu bạn có ThemeContext riêng

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme(); // nếu có

  return (
    <header style={{ padding: 16 }}>
      <Link to="/">Fanpage Lab</Link>

      {user && (
        <>
          <Link to="/dashboard" style={{ marginLeft: 12 }}>
            Dashboard
          </Link>

          {isAdmin && (
            <Link to="/admin/users" style={{ marginLeft: 12 }}>
              Admin tools
            </Link>
          )}

          <button onClick={toggleTheme} style={{ marginLeft: 12 }}>
            Đổi theme
          </button>

          <button onClick={logout} style={{ marginLeft: 12 }}>
            Logout
          </button>
        </>
      )}

      {!user && (
        <Link to="/login" style={{ marginLeft: 12 }}>
          Đăng nhập
        </Link>
      )}
    </header>
  );
}
