import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../AuthContext";
import { db } from "../firebase";
import { ref, get, update } from "firebase/database";
import { useNavigate } from "react-router-dom";

export default function JoinGate() {
  const { user, loading } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Đọc thông tin user từ Realtime Database
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    const userRef = ref(db, `users/${user.uid}`);
    setLoadingProfile(true);
    get(userRef)
      .then((snap) => {
        if (snap.exists()) {
          setProfile(snap.val());
        } else {
          setProfile(null);
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [user]);

  if (loading || loadingProfile) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Đang kiểm tra đăng nhập...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Bạn cần đăng nhập trước.</p>
          <button className="btn" onClick={() => navigate("/login")}>
            Về trang đăng nhập
          </button>
        </div>
      </main>
    );
  }

  const role = profile?.role || "guest";      // guest | member | associate
  const status = profile?.status || "none";   // none | pending | approved | rejected

  const requestVIP = async () => {
    if (!user) return;

    // ĐÃ là member/associate rồi thì không cho gửi thêm
    if (role === "member" || role === "associate") {
      alert("Bạn đã là thành viên rồi, không cần gửi yêu cầu nữa.");
      return;
    }

    // Đã gửi và đang pending thì không cho gửi lại
    if (status === "pending") {
      alert("Bạn đã gửi yêu cầu VIP, vui lòng chờ admin duyệt.");
      return;
    }

    try {
      setSubmitting(true);
      const userRef = ref(db, `users/${user.uid}`);

      // CHỈ cập nhật status (và requestedAt), không đụng role/joinCode/coin/level...
      await update(userRef, {
        status: "pending",
        requestedAt: Date.now(),
      });

      setProfile((prev) => ({
        ...(prev || {}),
        status: "pending",
      }));
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi gửi yêu cầu VIP. Bạn hãy thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="max-w" style={{ padding: 30 }}>
        <h1>Đăng ký thành viên VIP</h1>

        <p>Xin chào, {profile?.displayName || user.displayName || user.email}</p>

        {/* ĐÃ LÀ MEMBER/ASSOCIATE */}
        {(role === "member" || role === "associate") && (
          <>
            {role === "member" && (
              <>
                <p>Bạn đã là VIP (Member).</p>
                {profile?.joinCode && (
                  <p>
                    ID thành viên: <strong>{profile.joinCode}</strong>
                  </p>
                )}
              </>
            )}

            {role === "associate" && (
              <p>Bạn đang ở nhóm Cộng sự (Associate).</p>
            )}

            {status === "approved" && (
              <p>Yêu cầu của bạn đã được admin duyệt.</p>
            )}

            {status === "pending" && (
              <p>Trạng thái hiện tại: đang chờ admin duyệt.</p>
            )}
          </>
        )}

        {/* CHƯA LÀ MEMBER & CHƯA PENDING → cho gửi yêu cầu */}
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
            <button
              className="btn btn-primary"
              onClick={requestVIP}
              disabled={submitting}
            >
              {submitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu VIP"}
            </button>
          </>
        )}

        {/* ĐÃ gửi yêu cầu nhưng vẫn là guest → pending */}
        {status === "pending" && role === "guest" && (
          <p>Yêu cầu VIP của bạn đang chờ admin duyệt.</p>
        )}
      </div>
    </main>
  );
}
