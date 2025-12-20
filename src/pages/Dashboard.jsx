import React, { useEffect, useState } from "react";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import { useAuth } from "../AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!user) return;
    const r = ref(database, `users/${user.uid}`);
    get(r).then(snap => {
      if (snap.exists()) setInfo(snap.val());
    });
  }, [user]);

  if (!user) return <h1>Vui lòng đăng nhập.</h1>;
  if (!info) return <h1>Đang tải thông tin ...</h1>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>

      <h3>Email:</h3>
      <p>{info.email}</p>

      {info.role === "member" && (
        <>
          <h3>ID Thành viên:</h3>
          <p style={{
            fontWeight: "bold",
            fontSize: "26px",
            letterSpacing: "3px"
          }}>
            {info.memberId}
          </p>
        </>
      )}

      {info.role === "pending" && (
        <p>VIP status: Pending...</p>
      )}

      {info.role === "guest" && (
        <p>Bạn chưa gửi yêu cầu VIP.</p>
      )}
    </div>
  );
}
