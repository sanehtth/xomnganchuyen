import React from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export default function AdminPanel() {
  const { firebaseUser, isAdmin, loading } = useAuth();

  if (loading) return <p>Đang kiểm tra quyền...</p>;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!isAdmin) return <p>Bạn không có quyền truy cập khu vực admin.</p>;

  return (
    <div>
      <h1>Admin tools</h1>
      <ul>
        <li>
          <Link to="/admin/users">Quản lý user</Link>
        </li>
        {/* sau này thêm “Báo cáo”, “Công cụ”... */}
      </ul>
    </div>
  );
}
