import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { requestVip } from "../services/userService";

export default function JoinGate() {
  const { firebaseUser, profile, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return <p>Đang kiểm tra đăng nhập...</p>;
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  const role = profile?.role || "guest";
  const status = profile?.status || "none";
  const joinCode = profile?.joinCode || "";

  async function handleRequestVip() {
    try {
      setBusy(true);
      setError("");
      await requestVip(firebaseUser.uid);
      window.location.reload(); // đơn giản: reload để lấy profile mới
    } catch (err) {
      console.error(err);
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  // Các trạng thái khác nhau
  if (role === "admin") {
    return (
      <div>
        <h1>Cổng thành viên</h1>
        <p>Bạn đang là <strong>admin</strong>.</p>
        <p>Hãy dùng khu vực Admin để duyệt member khác.</p>
      </div>
    );
  }

  if (role !== "guest" && (status === "approved" || status === "admin")) {
    return (
      <div>
        <h1>Cổng thành viên VIP</h1>
        <p>
          Xin chào, {profile?.displayName || firebaseUser.displayName}.
        </p>
        <p>Bạn đã là VIP ({role}).</p>
        {joinCode && (
          <p>
            ID thành viên: <strong>{joinCode}</strong>
          </p>
        )}
        <p>Yêu cầu của bạn đã được admin duyệt.</p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div>
        <h1>Cổng thành viên</h1>
        <p>
          Xin chào, {profile?.displayName || firebaseUser.displayName}.
        </p>
        <p>
          Role hiện tại: <strong>{role}</strong>
        </p>
        <p>Trạng thái duyệt: <strong>pending</strong>.</p>
        <p>Yêu cầu của bạn đang chờ admin xử lý.</p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div>
        <h1>Cổng thành viên</h1>
        <p>
          Xin chào, {profile?.displayName || firebaseUser.displayName}.
        </p>
        <p>Yêu cầu lần trước đã bị từ chối. Bạn có thể gửi lại sau.</p>
        <button disabled={busy} onClick={handleRequestVip}>
          {busy ? "Đang gửi lại..." : "Gửi lại yêu cầu trở thành member"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  // Mặc định: guest + none
  return (
    <div>
      <h1>Cổng thành viên</h1>
      <p>
        Role hiện tại: <strong>{role}</strong>
      </p>
      <p>Trạng thái duyệt: <strong>{status}</strong></p>
      <button disabled={busy} onClick={handleRequestVip}>
        {busy ? "Đang gửi yêu cầu..." : "Gửi yêu cầu trở thành member"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
