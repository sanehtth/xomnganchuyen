import React, { useEffect, useState, useContext } from "react";
import { db } from "../firebase";
import { ref, get } from "firebase/database";
import { AuthContext } from "../AuthContext";

export default function Dashboard() {
  const { user, loading } = useContext(AuthContext);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!user) return;

    const r = ref(db, `users/${user.uid}`);
    get(r).then((snap) => {
      if (snap.exists()) setInfo(snap.val());
    });
  }, [user]);

  if (loading) return <div>Đang kiểm tra đăng nhập...</div>;

  if (!user) return <h1>Vui lòng đăng nhập.</h1>;

  if (!info) return <h1>Đang tải thông tin...</h1>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Xin chào, {info.displayName || user.displayName || user.email}</h1>

      <p>Email: {info.email || user.email}</p>
      <p>Role: {info.role || "guest"}</p>

      {info.role === "member" && (
        <>
          <h3>ID thành viên</h3>
          <p
            style={{
              fontWeight: "bold",
              fontSize: "26px",
              letterSpacing: "3px",
            }}
          >
            {info.memberId}
          </p>
        </>
      )}

      {info.role === "pending" && (
        <p>Yêu cầu VIP đang chờ admin duyệt.</p>
      )}

      {info.role === "guest" && <p>Bạn chưa gửi yêu cầu VIP.</p>}
    </div>
  );
}
