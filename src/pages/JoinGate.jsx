import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../AuthContext";
import { db } from "../firebase";
import { ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";

export default function JoinGate() {
  const { user, loading, role, memberStatus } = useContext(AuthContext);
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/login");

    if (memberStatus === "active" && role !== "guest") {
      return navigate("/dashboard");
    }

    const loadData = async () => {
      const userRef = ref(db, `users/${user.uid}`);
      const snap = await get(userRef);
      if (snap.exists()) setJoinCode(snap.val().joinCode);
    };

    loadData();
  }, [user, memberStatus, loading, navigate, role]);

  return (
    <main>
      <h1>Đăng ký thành viên VIP</h1>
      <p>Sub kênh Youtube → gửi mã này cho admin:</p>
      <h2>{joinCode}</h2>
      <p>Chờ admin duyệt thành viên.</p>
    </main>
  );
}
