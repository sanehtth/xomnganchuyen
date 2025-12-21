// src/components/Navbar.jsx

import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useTheme } from "../theme";

export default function Navbar() {
  const { firebaseUser, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        borderBottom: "1px solid #ddd",
        marginBottom: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link to="/" style={{ fontWeight: 700, textDecoration: "none" }}>
          Fanpage Lab
        </Link>

        {firebaseUser && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/join">Cổng thành viên</Link>
            {isAdmin && <Link to="/admin">Admin</Link>}
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={toggleTheme} className="btn">
          Theme: {theme === "light" ? "Light" : "Dark"}
        </button>

        {firebaseUser ? (
          <>
            <span style={{ fontSize: 14 }}>
              Xin chào, {firebaseUser.displayName || firebaseUser.email}
            </span>
            <button onClick={logout} className="btn">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary">
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
