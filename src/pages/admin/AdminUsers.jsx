// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../../firebase";

// Hàm tạo ID thành viên 10 ký tự (loại bỏ các ký tự dễ nhầm như O/0, I/1)
function generateMemberId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    const index = Math.floor(Math.random() * chars.length);
    result += chars[index];
  }
  return result;
}

// Các lựa chọn lọc theo vai trò / trạng thái
const ROLE_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Đang chờ duyệt" },
  { value: "guest", label: "Guest" },
  { value: "member", label: "Member (VIP)" },
  { value: "associate", label: "Associate (Cộng sự)" },
];

const STATUS_FILTERS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Đang chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
];

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("pending"); // mặc định show cần duyệt
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);

  // Lấy danh sách user từ Realtime Database
  useEffect(() => {
    const usersRef = ref(db, "users");

    const unsub = onValue(usersRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.entries(data).map(([uid, value]) => ({
        uid,
        email: value.email || "",
        displayName: value.displayName || "(No name)",
        role: value.role || "guest",
        status: value.status || "pending",
        joinCode: value.joinCode || "",
        joinedAt: value.joinedAt || "",
        lastActive: value.lastActive || "",
        xp: value.xp || 0,
        coin: value.coin || 0,
      }));
      // Sắp theo thời gian đăng ký mới nhất
      list.sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
      setUsers(list);
    });

    return () => unsub();
  }, []);

  // Lọc theo role + status
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterRole !== "all") {
        if (filterRole === "pending") {
          if (u.status !== "pending") return false;
        } else if (u.role !== filterRole) {
          return false;
        }
      }

      if (filterStatus !== "all" && u.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [users, filterRole, filterStatus]);

  const toggleSelect = (uid) => {
    setSelectedIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredUsers.map((u) => u.uid);
    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // bỏ chọn hết
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      // chọn tất cả user đang thấy
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkApprove = async (roleTarget) => {
    if (selectedIds.length === 0) {
      alert("Hãy chọn ít nhất 1 user trước khi duyệt.");
      return;
    }

    const ok = window.confirm(
      `Xác nhận duyệt ${selectedIds.length} user thành ${roleTarget.toUpperCase()}?`
    );
    if (!ok) return;

    try {
      setLoadingAction(true);

      const updates = {};

      selectedIds.forEach((uid) => {
        const user = users.find((u) => u.uid === uid);
        if (!user) return;

        updates[`users/${uid}/role`] = roleTarget;
        updates[`users/${uid}/status`] = "approved";

        // Nếu chưa có joinCode thì tạo ID thành viên 10 ký tự
        if (!user.joinCode) {
          updates[`users/${uid}/joinCode`] = generateMemberId();
        }
      });

      await update(ref(db), updates);

      alert("Duyệt thành công.");
      setSelectedIds([]);
    } catch (err) {
      console.error("Lỗi duyệt user:", err);
      alert("Có lỗi khi duyệt, thử lại sau.");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Quản lý User</h1>

        {/* Bộ lọc */}
        <div className="flex gap-2 mt-3 mb-3 items-center">
          <select
            className="input"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            {ROLE_FILTERS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            className="btn outline"
            type="button"
            onClick={toggleSelectAllVisible}
          >
            Chọn / bỏ chọn tất cả (đang hiển thị)
          </button>

          <button
            className="btn primary"
            type="button"
            disabled={loadingAction}
            onClick={() => handleBulkApprove("member")}
          >
            Duyệt thành Member
          </button>

          <button
            className="btn primary"
            type="button"
            disabled={loadingAction}
            onClick={() => handleBulkApprove("associate")}
          >
            Duyệt thành Associate
          </button>
        </div>

        {/* Bảng user */}
        <div className="card">
          {filteredUsers.length === 0 ? (
            <p>Không có user phù hợp với bộ lọc.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={toggleSelectAllVisible}
                      checked={
                        filteredUsers.length > 0 &&
                        filteredUsers.every((u) =>
                          selectedIds.includes(u.uid)
                        )
                      }
                    />
                  </th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>XP</th>
                  <th>Coin</th>
                  <th>Join ID</th>
                  <th>Joined</th>
                  <th>Last active</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.uid}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(u.uid)}
                        onChange={() => toggleSelect(u.uid)}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.displayName}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        {u.email}
                      </div>
                    </td>
                    <td>{u.role}</td>
                    <td>{u.status}</td>
                    <td>{u.xp}</td>
                    <td>{u.coin}</td>
                    <td>{u.joinCode || "-"}</td>
                    <td>{u.joinedAt || "-"}</td>
                    <td>{u.lastActive || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}

export default AdminUsers;
