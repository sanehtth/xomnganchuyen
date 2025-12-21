// src/pages/JoinGate.jsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { requestVip } from "../firebase";

export default function JoinGate() {
  const { firebaseUser, profile, loading, isLoggedIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (loading) {
    return <main className="app-shell">Đang tải...</main>;
  }

  if (!isLoggedIn) {
    return (
      <main className="app-shell">
        <p>Bạn cần đăng nhập trước.</p>
        <Link to="/login" className="btn btn-primary">
          Đăng nhập
        </Link>
      </main>
    );
  }

  const status = profile?.status || "none";

  const handleRequest = async () => {
    if (!firebaseUser) return;
    setSubmitting(true);
    try {
      await requestVip(firebaseUser.uid);
      setDone(true);
    } catch (err) {
      console.error(err);
      alert("Gửi yêu cầu bị lỗi, thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-shell">
      <h1>Cổng thành viên</h1>
      <p>Role hiện tại: {profile?.role || "guest"}</p>
      <p>Trạng thái duyệt: {status}</p>

      {status === "pending" && (
        <p>Bạn đã gửi yêu cầu, vui lòng chờ admin duyệt.</p>
      )}

      {status === "approved" && (
        <>
          <p>Yêu cầu đã được duyệt.</p>
          <p>Join code: {profile?.joinCode || "(admin chưa cấp)"}</p>
          <Link to="/dashboard" className="btn btn-primary">
            Về dashboard
          </Link>
        </>
      )}

      {status === "none" && (
        <button
          className="btn btn-primary"
          onClick={handleRequest}
          disabled={submitting || done}
        >
          {submitting ? "Đang gửi..." : done ? "Đã gửi yêu cầu" : "Gửi yêu cầu trở thành member"}
        </button>
      )}
    </main>
  );
}
