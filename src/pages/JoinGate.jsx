// src/pages/JoinGate.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { database } from "../firebase";
import { ref, get, update } from "firebase/database";

export default function JoinGate() {

  const { user, loading } = useAuth();
  const [role, setRole] = useState("guest");

  useEffect(() => {
    if (!user) return;
    const userRef = ref(database, `users/${user.uid}`);
    get(userRef).then(snap => {
      if (snap.exists()) {
        const data = snap.val();
        if (data.role) setRole(data.role);
      }
    });
  }, [user]);

  async function requestVIP() {
    if (!user) return;

    const userRef = ref(database, `users/${user.uid}`);
    await update(userRef, {
      email: user.email,
      displayName: user.displayName || "",
      role: "pending",
      joinRequestedAt: Date.now()
    });

    setRole("pending");
  }

  if (loading) return <div>Đang kiểm tra đăng nhập...</div>;
  if (!user) return <div>Bạn cần đăng nhập để đăng ký VIP.</div>;

  return (
    <div style={{ padding: 30 }}>
      <h1>Đăng ký VIP</h1>

      {role === "guest" && (
        <>
          <p>Bấm đăng ký để gửi yêu cầu VIP.</p>
          <button onClick={requestVIP}>
            Gửi yêu cầu VIP
          </button>
        </>
      )}

      {role === "pending" && (
        <p>Yêu cầu VIP của bạn đang chờ duyệt.</p>
      )}

      {role === "member" && (
        <p>Bạn đã là VIP. Vào Dashboard để xem thông tin.</p>
      )}
    </div>
  );
}
