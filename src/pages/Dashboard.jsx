// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { firestore } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      const ref = doc(firestore, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setProfile(snap.data());
      else setProfile(null);
      setLoadingProfile(false);
    };

    fetchProfile();
  }, [user]);

  if (loading || loadingProfile) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Đang tải...</p>
        </div>
      </main>
    );
  }

  if (!user || !profile) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Bạn chưa đăng nhập.</p>
        </div>
      </main>
    );
  }

  const role = profile.role || "guest";
  const status = profile.status || "none";

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Xin chào, {profile.displayName || user.email}</h1>

        <p>Email: {profile.email || user.email}</p>
        <p>Role: {role}</p>
        <p>Trạng thái: {status}</p>

        {role === "member" && status === "approved" && (
          <>
            <h3>ID thành viên</h3>
            <p
              style={{
                fontWeight: "bold",
                fontSize: "26px",
                letterSpacing: "3px",
              }}
            >
              {profile.joinCode || "(chưa có ID)"}
            </p>

            <h3>Chỉ số công khai</h3>
            <ul>
              <li>XP: {profile.stats?.xp ?? 0}</li>
              <li>Coin: {profile.stats?.coin ?? 0}</li>
              <li>Level: {profile.stats?.level ?? 1}</li>
            </ul>
          </>
        )}

        {role === "guest" && status === "none" && (
          <p>Bạn chưa gửi yêu cầu VIP. Vào trang Đăng ký VIP để gửi yêu cầu.</p>
        )}

        {status === "pending" && (
          <p>Yêu cầu VIP của bạn đang chờ admin duyệt.</p>
        )}
      </div>
    </main>
  );
}
