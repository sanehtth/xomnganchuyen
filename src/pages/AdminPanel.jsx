import { useContext } from "react";
import { AuthContext } from "../AuthContext.jsx";

export function AdminPanel() {
  const { user, loading, isAdmin } = useContext(AuthContext);

  if (loading) return <div className="max-w">Đang tải...</div>;
  if (!user) return (
    <div className="max-w">
      <p>Bạn chưa đăng nhập.</p>
      <a href="/login">Đăng nhập</a>
    </div>
  );
  if (!isAdmin) return (
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
          <p>Ở đây bạn sẽ thêm:</p>
          <ul>
            <li>Quản lý user</li>
            <li>Hàng chờ duyệt nội dung</li>
            <li>Các tool nội bộ (video, quiz...)</li>
          </ul>
          <p>Bạn có thể tạo thêm trang riêng và route tới từ đây.</p>
        </div>
      </div>
    </main>
  );
}