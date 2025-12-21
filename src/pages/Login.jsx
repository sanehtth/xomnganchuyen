// src/pages/Login.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { user, checkingAuth, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Nếu đã đăng nhập rồi thì không cho ở lại /login
  useEffect(() => {
    if (!checkingAuth && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [checkingAuth, user, navigate]);

  if (checkingAuth) {
    // Chỉ hiện cái này đúng 1 lần lúc load trang
    return (
      <main style={{ padding: 40 }}>
        <h1>Fanpage Lab</h1>
        <p>Đang kiểm tra đăng nhập...</p>
      </main>
    );
  }

  // Đã kiểm tra xong mà chưa có user => cho bấm đăng nhập
  return (
    <main style={{ padding: 40 }}>
      <h1>Fanpage Lab</h1>
      <p>Đăng nhập để vào hệ thống tuyển người & đào tạo.</p>

      <button onClick={loginWithGoogle} disabled={loading}>
        {loading ? "Đang đăng nhập..." : "Đăng nhập với Google"}
      </button>
    </main>
  );
}
