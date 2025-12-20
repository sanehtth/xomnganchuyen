import { useEffect, useState } from "react";
import { auth, database } from "../firebase";
import { ref, set, get } from "firebase/database";
import { nanoid } from "nanoid";

export default function JoinGate() {
  const [code, setCode] = useState("");
  const user = auth.currentUser;

  async function generateCode() {

    if (!user) return;

    const newCode = nanoid(6).toUpperCase();

    await set(ref(database, "users/" + user.uid + "/joinCode"), newCode);
    await set(ref(database, "users/" + user.uid + "/joinStatus"), "pending");

    setCode(newCode);
  }

  useEffect(() => {
    async function loadOldCode() {
      if (!user) return;
      const snap = await get(ref(database, "users/" + user.uid + "/joinCode"));
      if (snap.exists()) setCode(snap.val());
    }
    loadOldCode();
  }, [user]);

  if (!user) return <p>Bạn chưa đăng nhập.</p>;

  return (
    <div style={{ padding: 30 }}>
      <h1>Đăng ký thành viên VIP</h1>
      <p>Nhấn nút dưới để tạo mã 6 ký tự và gửi cho Admin:</p>

      <button onClick={generateCode}>
        Tạo hoặc lấy lại mã
      </button>

      {code && (
        <div>
          <h3>Mã của bạn:</h3>
          <input
            value={code}
            readOnly
            style={{ fontSize: 20 }}
          />

          <button
            onClick={() => navigator.clipboard.writeText(code)}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}
