import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useTheme } from "../theme";

export default function Navbar() {
  const { firebaseUser, profile, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      style={{
        padding: "8px 16px",
        borderBottom: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Link to="/" style={{ fontWeight: "bold" }}>
          Fanpage Lab
        </Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/join">Cổng thành viên</Link>
        {isAdmin && <Link to="/admin/users">Admin</Link>}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span>Theme: {theme === "light" ? "Light" : "Dark"}</span>
        <button onClick={toggleTheme}>Đổi theme</button>
        {firebaseUser ? (
          <>
            <span>
              Xin chào, {profile?.displayName || firebaseUser.displayName}
            </span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Đăng nhập</Link>
        )}
      </div>
    </nav>
  );
}
