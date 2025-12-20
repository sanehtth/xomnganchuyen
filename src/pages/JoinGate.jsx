import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../AuthContext";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

export default function JoinGate() {
  const { user, loading } = useContext(AuthContext);
  const [memberCode, setMemberCode] = useState("");

  useEffect(() => {
    if (!user) return;

    const path = ref(db, "users/" + user.uid + "/code6");

    onValue(path, (snap) => {
      if (snap.exists()) {
        setMemberCode(snap.val());
      }
    });
  }, [user]);

  if (loading) {
    return (
      <main className="app-shell">
        <div className="max-w">Đang tải dữ liệu...</div>
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

  const copyCode = () => {
    navigator.clipboard.writeText(memberCode);
    alert("Đã copy mã!");
  };

  return (
    <main className="app-shell">
      <div className="max-w">

        <h1>Đăng ký thành viên VIP</h1>
        <br />

        <p style={{ fontSize: "18px" }}>
          Đầu tiên hãy sub kênh Youtube của hệ thống:
        </p>

        <a
          href="https://www.youtube.com/@xomnganchuyen?sub_confirmation=1"
          target="_blank"
          rel="noreferrer"
          className="btn"
        >
          ► Bấm để sub Youtube
        </a>

        <br /><br /><br />

        <p style={{ fontSize: "18px" }}>
          Đây là mã thành viên của bạn – gửi về admin:
        </p>

        <input
          type="text"
          value={memberCode}
          readOnly
          style={{
            width: "240px",
            height: "40px",
            fontSize: "20px",
            textAlign: "center",
            marginRight: "6px",
          }}
        />

        <button onClick={copyCode} className="btn">
          Copy mã
        </button>

        <br /><br />

        <p>Khi admin duyệt, bạn sẽ được mở quyền VIP.</p>
      </div>
    </main>
  );
}
