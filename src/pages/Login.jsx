import { useContext } from "react";
import { AuthContext } from "../AuthContext.jsx";
import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";

const provider = new GoogleAuthProvider();

export function LoginPage() {
  const { user, loading, role } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (user) return;
    try {
      await signInWithPopup(auth, provider);
      
      // Sau khi login thành công → AuthContext sẽ cập nhật "role"
      // Ta redirect theo role:

      if (role === "guest") {
        return navigate("/join-gate");
      }

      if (role === "member") {
        return navigate("/dashboard");
      }

      if (role === "associate") {
        return navigate("/dashboard");
      }

    } catch (err) {
      console.error("Login error:", err);

      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request" ||
        err.code === "auth/popup-blocked-by-browser"
      ) {
        return;
      }

      alert("Có lỗi khi đăng nhập. Bạn hãy thử lại sau.");
    }
  };

  if (loading) {
    return (
      <main className="app-shell">
        <div className="max-w">Đang kiểm tra trạng thái đăng nhập...</div>
      </main>
    );
  }

  if (user) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Bạn đã đăng nhập.</p>
          <p>
            <Link to="/dashboard">Về trang chính </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Đăng nhập Fanpage</h1>
        <p>Dùng Google để vào hệ thống.</p>

        <button className="btn primary mt-3" onClick={handleLogin}>
          Đăng nhập với Google
        </button>
      </div>
    </main>
  );
}
