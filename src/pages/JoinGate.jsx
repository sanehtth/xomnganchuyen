// src/pages/JoinGate.jsx
import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { requestVip } from "../firebase";

/**
 * JoinGate: Trang để guest gửi yêu cầu trở thành member.
 * Điều kiện:
 *  - role = guest
 *  - status = none  => chưa gửi yêu cầu
 *  - status = pending => báo đang chờ
 */
function JoinGate() {
  const { firebaseUser, profile } = useAuth();
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  if (!firebaseUser) {
    return <div>Bạn cần đăng nhập trước.</div>;
  }

  if (profile?.status === "pending") {
    return (
      <div style={{ padding: 40 }}>
        <h1>Cổng đăng ký VIP</h1>
        <p>Xin chào, {profile.displayName || profile.email}</p>
        <p>Yêu cầu VIP của bạn đang chờ admin duyệt.</p>
      </div>
    );
  }

  if (profile?.role === "member" || profile?.role === "contributor") {
    return (
      <div style={{ padding: 40 }}>
        <h1>Cổng đăng ký VIP</h1>
        <p>Bạn đã là VIP ({profile.role}).</p>
        <p>ID thành viên: {profile.joinCode || "(admin chưa tạo mã)"}</p>
      </div>
    );
  }

  const handleRequestVip = async () => {
    if (!firebaseUser) return;
    setSending(true);
    try {
      // tạo mã joinCode đơn giản: 8 ký tự random
      const joinCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await requestVip(firebaseUser.uid, joinCode);
      setDone(true);
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Cổng đăng ký VIP</h1>
        <p>Đã gửi yêu cầu VIP thành công.</p>
        <p>Vui lòng chờ admin duyệt.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Cổng đăng ký VIP</h1>
      <p>Xin chào, {profile?.displayName || profile?.email}</p>
      <p>Hiện tại bạn là <b>guest</b>.</p>

      <ol>
        <li>Đầu tiên: sub kênh YouTube của bạn.</li>
        <li>Sau đó bấm nút dưới để gửi yêu cầu VIP.</li>
      </ol>

      <button disabled={sending} onClick={handleRequestVip}>
        {sending ? "Đang gửi..." : "Gửi yêu cầu VIP"}
      </button>
    </div>
  );
}

export default JoinGate;
