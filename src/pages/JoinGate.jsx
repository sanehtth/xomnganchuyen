// src/pages/JoinGate.jsx
import React, { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { requestVip } from "../firebase.js";

export default function JoinGate() {
  const { loading, isLoggedIn, user, profile, status, role } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (loading) return <p>Đang tải...</p>;
  if (!isLoggedIn) return <p>Bạn cần đăng nhập trước.</p>;

  const handleRequest = async () => {
    if (!user) return;
    setSubmitting(true);
    setError("");
    try {
      await requestVip(user.uid);
    } catch (err) {
      console.error(err);
      setError("Có lỗi khi gửi yêu cầu, thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ padding: 30 }}>
      <h1>Cổng đăng ký VIP</h1>

      <p className="mt-2">
        Xin chào, <strong>{profile?.displayName || user?.displayName}</strong>
      </p>

      {role !== "guest" && (
        <p className="mt-3">
          Bạn đã là <strong>{role}</strong>. Không cần gửi yêu cầu nữa.
        </p>
      )}

      {role === "guest" && status === "none" && (
        <>
          <p className="mt-3">
            Bạn hiện là guest. Nếu đã làm đủ bước (sub kênh, tham gia hoạt
            động...), hãy bấm nút dưới để gửi yêu cầu VIP.
          </p>
          <button
            className="btn btn-primary mt-3"
            onClick={handleRequest}
            disabled={submitting}
          >
            {submitting ? "Đang gửi..." : "Gửi yêu cầu VIP"}
          </button>
        </>
      )}

      {status === "pending" && (
        <p className="mt-3">
          Yêu cầu VIP đang chờ admin duyệt. Khi được duyệt, bạn sẽ thấy role và
          joinCode ở trang dashboard.
        </p>
      )}

      {status === "approved" && (
        <p className="mt-3">
          Yêu cầu của bạn đã được duyệt. Hãy xem Dashboard để lấy ID / joinCode.
        </p>
      )}

      {error && <p className="mt-3" style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
