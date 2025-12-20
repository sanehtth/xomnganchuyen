// src/components/Navbar.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../AuthContext.jsx";
// nếu có ThemeContext thì vẫn import như cũ:
 import { ThemeContext } from "../theme.jsx";

function Navbar() {
  const { firebaseUser, role, isAdmin, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/">Fanpage Lab</Link>
      </div>

      <div className="navbar-right">
        {firebaseUser && (
          <>
            <span>{firebaseUser.displayName}</span>
            {isAdmin && (
              <Link to="/admin/users" className="nav-link">
                Admin tools
              </Link>
            )}
            <button onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
