// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { useTheme } from "../theme.jsx";

export default function Navbar() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar">
      <div className="nav-title">Fanpage Lab</div>

      <div className="nav-links">
        <button className="btn btn-ghost" onClick={toggleTheme}>
          Theme: {theme === "light" ? "Light" : "Dark"}
        </button>

        {isLoggedIn && (
          <>
            <span style={{ fontSize: 12 }}>Hi, {user?.displayName}</span>
            <Link to="/dashboard" className="btn btn-primary">
              Dashboard
            </Link>
            {isAdmin && (
              <Link to="/admin" className="btn">
                Admin tools
              </Link>
            )}
            <button className="btn btn-ghost" onClick={logout}>
              Logout
            </button>
          </>
        )}

        {!isLoggedIn && (
          <Link to="/login" className="btn btn-primary">
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
