import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../AuthContext";
import { db } from "../firebase";
import { ref, get, update } from "firebase/database";
import { useNavigate } from "react-router-dom";

export default function JoinGate() {
  const { user, loading } = useContext(AuthContext);
  const [role, setRole] = useState("guest");
  const [status, setStatus] = useState("none"); // thêm trạng thái riêng
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const userRef = ref(db, `users/${user.uid}`);
    get(userRef).then((snap) => {
      if (!snap.exists()) {
        setRole("guest");
        setStatus("none");
        return;
      }
      const data = snap.val();
      setRole(data.role || "guest");
      setStatus(data.status || "none");
    });
  }, [user]);

  async function requestVIP() {
    if (!user) {
      navigate("/login");
      return;
    }

    const userRef = ref(db, `users/${user.uid}`);

    await update(userRef, {
      email: user.email,
      displayName: user.displayName || "",
      // KHÔNG đổi role ở đây, để role vẫn là "guest"
      status: "pending", // đánh dấu đã gửi yêu cầu
      joinRequestedAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    setStatus("pending");
  }

  if (loading) return <div>Đang kiểm tra đăng nhập...</div>;

  if (!user) {
    return (
      <div style={{ padding: 30 }}>
        <h1>Đăng ký VIP</h1>
        <p>Bạn cần đăng nhập để sử dụng tính năng này.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Đăng ký thành viên VIP</h1>

      {/* Chưa gửi yêu cầu và vẫn là guest */}
      {status !== "pending" && role === "guest" && (
        <>
          <p>Đầu tiên, hãy sub kênh Youtube của hệ thống rồi bấm nút dưới.</p>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Bấm để sub Youtube
          </a>

          <br />
          <br />

          <p>Sau đó bấm nút dưới để gửi yêu cầu VIP:</p>
          <button className="btn btn-primary" onClick={requestVIP}>
            Gửi yêu cầu VIP
          </button>
        </>
      )}

      {/* Đã gửi yêu cầu, chờ duyệt */}
      {status === "pending" && (
        <p>Yêu cầu VIP của bạn đang chờ admin duyệt.</p>
      )}

      {/* Đã là member */}
      {status === "approved" && role === "member" && (
        <p>Bạn đã là VIP. ID sẽ hiển thị trong Dashboard.</p>
      )}

      {/* Nếu sau này dùng associate */}
      {status === "approved" && role === "associate" && (
        <p>Bạn đang ở nhóm Cộng sự (Associate).</p>
      )}
    </div>
  );
}
