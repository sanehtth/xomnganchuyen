import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../AuthContext.jsx";

export default function AdminPanel() {
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

  if (!isAdmin) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <h1>Admin tools</h1>
          <p>Bạn không có quyền truy cập khu vực admin.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Admin tools</h1>
        <p>Chọn khu vực bạn muốn quản lý:</p>

        <div className="cards-grid mt-3">
          <div className="card">
            <div className="card-header">Quản lý user</div>
            <div className="card-body">
              <p>Xem danh sách guest / member / cộng sự, level, XP, coin…</p>
              <Link to="/admin/users" className="btn">
                Mở trang quản lý user
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header">Đăng ký VIP</div>
            <div className="card-body">
              <p>
                Kiểm tra những user gửi mã 6 ký tự, xác nhận đã sub kênh và
                duyệt lên member / cộng sự.
              </p>
              <Link to="/join-gate" className="btn outline">
                Xem trang join gate
              </Link>
            </div>
          </div>

          {/* Sau này bạn có thể thêm card vinh danh, nhiệm vụ, thống kê… */}
        </div>
      </div>
    </main>
  );
}
