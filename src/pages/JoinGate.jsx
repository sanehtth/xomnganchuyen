// src/pages/JoinGate.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { firestore } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function JoinGate() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

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

  if (!user) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <h1>Đăng ký VIP</h1>
          <p>Bạn cần đăng nhập trước.</p>
          <button className="btn" onClick={() => navigate("/login")}>
            Về trang đăng nhập
          </button>
        </div>
      </main>
    );
  }

  if (loadingProfile || !profile) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Đang tải thông tin...</p>
        </div>
      </main>
    );
  }

  const role = profile.role || "guest";
  const status = profile.status || "none";

  const requestVIP = async () => {
    if (!user) return;

    if (role === "member" || role === "associate" || role === "admin") {
      alert("Bạn đã là thành viên rồi, không cần gửi yêu cầu.");
      return;
    }

    if (status === "pending") {
      alert("Bạn đã gửi yêu cầu VIP, vui lòng chờ admin duyệt.");
      return;
    }

    try {
      setSubmitting(true);
      const ref = doc(firestore, "users", user.uid);
      await updateDoc(ref, {
        status: "pending",
        requestAt: Date.now(),
      });

      setProfile((prev) => ({
        ...prev,
        status: "pending",
      }));
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi gửi yêu cầu VIP.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Đăng ký thành viên VIP</h1>
        <p>Xin chào, {profile.displayName || user.email}</p>

        {/* ĐÃ LÀ MEMBER/ASSOCIATE/ADMIN */}
        {(role === "member" || role === "associate" || role === "admin") && (
          <>
            <p>Bạn đã là thành viên: {role.toUpperCase()}.</p>
            {profile.joinCode && (
              <p>
                ID thành viên: <strong>{profile.joinCode}</strong>
              </p>
            )}
            {status === "pending" && (
              <p>Trạng thái: đang chờ duyệt (có thể do bạn mới apply role khác).</p>
            )}
            {status === "approved" && <p>Trạng thái: đã duyệt.</p>}
          </>
        )}

        {/* GUEST CHƯA GỬI YÊU CẦU */}
        {role === "guest" && status !== "pending" && (
          <>
            <p>
              Bước 1: Bấm vào link dưới để subscribe kênh YouTube của hệ thống.
            </p>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Bấm để sub YouTube
            </a>

            <br />
            <br />

            <p>Bước 2: Bấm nút dưới để gửi yêu cầu VIP:</p>
            <button
              className="btn btn-primary"
              onClick={requestVIP}
              disabled={submitting}
            >
              {submitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu VIP"}
            </button>
          </>
        )}

        {/* GUEST ĐÃ GỬI YÊU CẦU */}
        {role === "guest" && status === "pending" && (
          <p>Yêu cầu VIP của bạn đang chờ admin duyệt.</p>
        )}
      </div>
    </main>
  );
}
