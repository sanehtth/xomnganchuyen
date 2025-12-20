// src/pages/Dashboard.jsx
import React, { useEffect, useState, useContext } from "react";
import { db } from "../firebase";
import { ref, get } from "firebase/database";
import { AuthContext } from "../AuthContext";

export default function Dashboard() {
  const { user, loading } = useContext(AuthContext);
  const [info, setInfo] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) {
      setInfo(null);
      setFetching(false);
      return;
    }

    const r = ref(db, `users/${user.uid}`);
    setFetching(true);
    get(r)
      .then((snap) => {
        if (snap.exists()) {
          setInfo(snap.val());
        } else {
          setInfo(null);
        }
      })
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || fetching) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Đang tải...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Bạn chưa đăng nhập.</p>
        </div>
      </main>
    );
  }

  const role = info?.role || "guest";
  const status = info?.status || "none";
  const name = info?.displayName || user.displayName || user.email;

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Xin chào, {name}</h1>

        <p>Email: {info?.email || user.email}</p>
        <p>Role: {role}</p>

        {/* Hiển thị thông tin VIP */}
        {role === "member" && status === "approved" && (
          <>
            <p>Bạn là thành viên VIP.</p>
            <p>
              ID thành viên:{" "}
              <strong>{info?.joinCode || "(chưa có ID)"}</strong>
            </p>
          </>
        )}

        {status === "pending" && (
          <p>Yêu cầu VIP đang chờ admin duyệt.</p>
        )}

        {role === "guest" && status !== "pending" && (
          <p>Bạn chưa gửi yêu cầu VIP.</p>
        )}
      </div>
    </main>
  );
}
