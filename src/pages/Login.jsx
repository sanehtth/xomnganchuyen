// src/pages/Login.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

function LoginPage() {
  const { firebaseUser, profile, loginWithGoogle, theme, setTheme } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    await loginWithGoogle();

    // Logic điều hướng sau khi login
    if (profile?.role === "admin") {
      navigate("/admin/users");
    } else if (profile?.role === "member" || profile?.role === "contributor") {
      navigate("/dashboard");
    } else {
      // guest
      navigate("/join");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Fanpage Lab</h1>

      <p>Đăng nhập để vào hệ thống tuyển người & đào tạo.</p>

      <button onClick={handleLogin}>Đăng nhập với Google</button>

      <div style={{ marginTop: 20 }}>
        <span>Theme hiện tại: {theme}</span>{" "}
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          Đổi theme
        </button>
      </div>

      {firebaseUser && (
        <div style={{ marginTop: 20 }}>
          <div>Đang đăng nhập: {firebaseUser.email}</div>
          <button onClick={() => navigate("/dashboard")}>
            Vào dashboard
          </button>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
