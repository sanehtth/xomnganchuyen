import { useContext } from "react";
import { AuthContext } from "../AuthContext.jsx";
import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Link } from "react-router-dom";

const provider = new GoogleAuthProvider();

export function LoginPage() {
  const { user, loading } = useContext(AuthContext);

  const handleLogin = async () => {
    // đã đăng nhập rồi thì không gọi lại
    if (user) return;

    try {
      await signInWithPopup(auth, provider);
      // thành công: AuthContext sẽ tự cập nhật user, không cần alert gì
    } catch (err) {
      console.error("Login error:", err);

      // Một số lỗi không cần báo cho user (bị chặn popup, đóng popup, request trùng)
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

  // Nếu đã đăng nhập rồi thì chỉ cho quay về Dashboard, không hiển thị nút login nữa
  if (user) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Bạn đã đăng nhập.</p>
          <p>
            <Link to="/dashboard">Về trang chính</Link>
          </p>
        </div>
      </main>
    );
  }

  // Chưa đăng nhập → hiển thị nút login
  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Đăng nhập Fanpage</h1>
        <p>Dùng Google để vào hệ thống fan &amp; admin.</p>

        <button className="btn primary mt-3" onClick={handleLogin}>
          Đăng nhập với Google
        </button>
      </div>
    </main>
  );
}
