import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue, update, get } from "firebase/database";
import { db } from "../../firebase";

// =======================
// TẠO ID KHÔNG TRÙNG LẶP
// =======================

async function generateUniqueMemberId() {
  function randomId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  while (true) {
    const candidate = randomId();

    const snap = await get(ref(db, "users"));
    const users = snap.val() || {};

    let exists = false;

    Object.values(users).forEach((u) => {
      if (u.joinCode === candidate) exists = true;
    });

    if (!exists) return candidate;
  }
}

// ============================================

const ROLE_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Đang chờ duyệt" },
  { value: "guest", label: "Guest" },
  { value: "member", label: "Member (VIP)" },
  { value: "associate", label: "Associate (Cộng sự)" },
];

const STATUS_FILTERS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "none", label: "Chưa gửi yêu cầu" },
  { value: "pending", label: "Đang chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
];

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
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
        // status mặc định là "none" = chưa gửi yêu cầu
        status: value.status || "none",
        joinCode: value.joinCode || "",
        joinedAt: value.createdAt || "",
        lastActive: value.lastActiveAt || "",
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
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // DUYỆT USER → TẠO ID KHÔNG TRÙNG
  const handleBulkApprove = async (roleTarget) => {
    if (selectedIds.length === 0) {
      alert("Chọn ít nhất 1 user.");
      return;
    }

    const ok = window.confirm(
      `Xác nhận duyệt ${selectedIds.length} user thành ${roleTarget.toUpperCase()}?`
    );
    if (!ok) return;

    try {
      setLoadingAction(true);

      const updates = {};

      for (const uid of selectedIds) {
        const user = users.find((u) => u.uid === uid);
        if (!user) continue;

        updates[`users/${uid}/role`] = roleTarget;
        updates[`users/${uid}/status`] = "approved";

        if (!user.joinCode) {
          const id = await generateUniqueMemberId();
          updates[`users/${uid}/joinCode`] = id;
        }
      }

      await update(ref(db), updates);

      alert("Duyệt thành công.");
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
      alert("Có lỗi xảy ra");
    } finally {
      setLoadingAction(false);
    }
  };

  // TẠO ID CHO USER ĐÃ DUYỆT NHƯNG THIẾU ID
  const createMissingIds = async () => {
    const ok = window.confirm(
      "Bạn có chắc muốn tạo ID cho toàn bộ user đã duyệt nhưng thiếu ID?"
    );
    if (!ok) return;

    try {
      setLoadingAction(true);

      const updates = {};

      for (const user of users) {
        const approved = user.status === "approved";
        const vip = user.role === "member" || user.role === "associate";

        if (approved && vip && !user.joinCode) {
          const id = await generateUniqueMemberId();
          updates[`users/${user.uid}/joinCode`] = id;
        }
      }

      if (Object.keys(updates).length === 0) {
        alert("Không có user cần tạo ID.");
        return;
      }

      await update(ref(db), updates);

      alert("Đã tạo xong ID cho mọi user thiếu ID.");
    } catch (e) {
      console.error(e);
      alert("Có lỗi khi tạo lại ID.");
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
            onClick={toggleSelectAllVisible}
            disabled={loadingAction}
          >
            Chọn / Bỏ chọn hiển thị
          </button>

          <button
            className="btn primary"
            onClick={() => handleBulkApprove("member")}
            disabled={loadingAction}
          >
            Duyệt thành Member
          </button>

          <button
            className="btn primary"
            onClick={() => handleBulkApprove("associate")}
            disabled={loadingAction}
          >
            Duyệt thành Associate
          </button>

          <button
            className="btn warning"
            onClick={createMissingIds}
            disabled={loadingAction}
          >
            Tạo ID cho user đã duyệt
          </button>
        </div>

        {/* Bảng user */}
        <div className="card">
          {filteredUsers.length === 0 ? (
            <p>Không có user phù hợp bộ lọc hiện tại.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>XP</th>
                  <th>Coin</th>
                  <th>ID</th>
                  <th>Joined</th>
                  <th>Last Active</th>
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
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
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
