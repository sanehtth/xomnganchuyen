import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../AuthContext.jsx";

export default function Dashboard() {
  const { user, loading, isAdmin } = useContext(AuthContext);

  if (loading) {
    return (
      <main className="app-shell">
        <div className="max-w">Đang tải dữ liệu...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Bạn chưa đăng nhập.</p>
          <p>
            <Link to="/login" className="btn">
              Về trang đăng nhập
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Xin chào, {user.displayName || "bạn"}</h1>

        <div className="card mt-3">
          <div className="card-header">Thông tin cơ bản</div>
          <div className="card-body">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>UID:</strong> {user.uid}
            </p>
            <p>
              <strong>Vai trò:</strong> {isAdmin ? "Admin" : "Thành viên"}
            </p>
            <p style={{ fontSize: 13, opacity: 0.8 }}>
              (Level / XP / Coin sẽ hiển thị sau khi kết nối Realtime Database cho
              profile chi tiết.)
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-3">
            <Link to="/admin/users" className="btn">
              Mở trang quản lý user
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
