// src/pages/Login.jsx

import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useTheme } from "../theme";

export default function Login() {
  const navigate = useNavigate();
  const { isLoggedIn, loginWithGoogle, loading, firebaseUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error", err);
      alert("Đăng nhập thất bại, thử lại sau.");
    }
  };

  if (isLoggedIn) {
    return (
      <main className="app-shell">
        <p>Đã đăng nhập với: {firebaseUser?.email}</p>
        <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
          Vào dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <h1>Fanpage Lab</h1>
      <p>Đăng nhập để vào hệ thống tuyển người & đào tạo.</p>

      <div className="mt-3">
        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập với Google"}
        </button>
      </div>

      <div className="mt-3">
        <span>Theme hiện tại: {theme === "light" ? "Light" : "Dark"}</span>{" "}
        <button className="btn" onClick={toggleTheme}>
          Đổi theme
        </button>
      </div>
    </main>
  );
}
