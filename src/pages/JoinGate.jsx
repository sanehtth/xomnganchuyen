// src/pages/JoinGate.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { db } from "../firebase";
import { ref, get, set } from "firebase/database";

// Hàm tạo mã 6 ký tự: chỉ dùng chữ + số dễ đọc
function makeJoinCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default function JoinGate() {
  const { user, loading } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");

  // Lấy mã đang có trong DB (nếu có)
  useEffect(() => {
    if (!user) return;
    const codeRef = ref(db, `users/${user.uid}/meta/joinCode`);
    get(codeRef)
      .then((snap) => {
        if (snap.exists()) {
          setJoinCode(snap.val());
        }
      })
      .catch((err) => {
        console.error("Load joinCode error:", err);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="app-shell">
        <p>Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-shell">
        <p>Bạn cần đăng nhập trước khi đăng ký thành viên VIP.</p>
      </div>
    );
  }

  async function handleGenerate() {
    if (!user || saving) return;
    setSaving(true);
    setStatus("");

    try {
      const newCode = makeJoinCode(6);
      const codeRef = ref(db, `users/${user.uid}/meta/joinCode`);
      await set(codeRef, newCode);
      setJoinCode(newCode);
      setStatus("Đã tạo mã mới. Hãy gửi mã này cho admin.");
    } catch (err) {
      console.error("Save joinCode error:", err);
      setStatus("Có lỗi khi lưu mã, thử lại sau nhé.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setStatus("Đã copy mã vào clipboard.");
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
      setStatus("Trình duyệt không cho copy tự động, bạn hãy tự bôi đen và copy.");
    }
  }

  const youtubeChannelUrl = "https://www.youtube.com/@xomnganchuyen"; // đổi nếu cần

  return (
    <div className="app-shell">
      <div className="card card-narrow">
        <h1>Đăng ký thành viên VIP</h1>

        <p>Đầu tiên hãy sub kênh Youtube của hệ thống:</p>
        <a
          className="btn btn-primary"
          href={youtubeChannelUrl}
          target="_blank"
          rel="noreferrer"
        >
          ▶ Bấm để sub Youtube
        </a>

        <hr />

        <p>Đây là mã thành viên của bạn – gửi về admin:</p>
        <div className="join-row">
          <input
            type="text"
            readOnly
            value={joinCode || ""}
            placeholder="Bấm &quot;Tạo mã&quot; để nhận mã 6 ký tự"
            className="join-input"
          />
          {!joinCode && (
            <button
              className="btn btn-secondary"
              onClick={handleGenerate}
              disabled={saving}
            >
              {saving ? "Đang tạo..." : "Tạo mã"}
            </button>
          )}
          {joinCode && (
            <button className="btn btn-secondary" onClick={handleCopy}>
              {copied ? "Đã copy" : "Copy mã"}
            </button>
          )}
        </div>

        <p className="hint">
          Khi admin duyệt, bạn sẽ được mở quyền VIP.  
          Nếu bạn mất mã, hãy vào lại trang này để lấy lại (mã cũ vẫn giữ nguyên).
        </p>

        {status && <p className="status-text">{status}</p>}
      </div>
    </div>
  );
}
