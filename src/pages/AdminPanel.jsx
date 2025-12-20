import { useContext } from "react";
import { AuthContext } from "../AuthContext.jsx";
import { Link } from "react-router-dom";

export function AdminPanel() {
  const { user, loading, isAdmin } = useContext(AuthContext);

  if (loading) return <div className="max-w">Đang tải...</div>;
  if (!user)
    return (
      <div className="max-w">
        <p>Bạn chưa đăng nhập.</p>
        <a href="/login">Đăng nhập</a>
      </div>
    );
  if (!isAdmin)
    return (
      <div className="max-w">
        <p>Bạn không có quyền admin.</p>
        <a href="/">Về trang chính</a>
      </div>
    );

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Khu vực Admin</h1>
        <div className="card mt-3">
          <h3>Công cụ quản trị</h3>
          <ul>
            <li>
              <Link className="btn outline" to="/admin/users">
                Quản lý user
              </Link>
            </li>
            {/* sau này thêm:
              <li><Link to="/admin/review">Duyệt nội dung</Link></li>
            */}
          </ul>
        </div>
      </div>
    </main>
  );
}
