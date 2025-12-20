// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState, useMemo } from "react";
import { ref, onValue, update } from "firebase/database";
import { database } from "../../firebase"; // CHÚ Ý: đường dẫn tới firebase.js

const ROLE_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Đang chờ duyệt" },
  { value: "guest", label: "Guest" },
  { value: "member", label: "Member (VIP)" },
  { value: "associate", label: "Associate (Cộng sự)" },
];

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("pending"); // mặc định show cần duyệt
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);

  // Lấy danh sách user từ Realtime Database
  useEffect(() => {
    const usersRef = ref(database, "users");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, u]) => ({
        id,
        email: u.email || "",
        displayName: u.displayName || "",
        role: u.role || "guest",
        status: u.status || "",
        memberId: u.memberId || "",
        level: u.level ?? 1,
        xp: u.xp ?? 0,
        coin: u.coin ?? 0,
        joinedAt: u.joinedAt || null,
        lastActive: u.lastActive || null,
      }));
      setUsers(list);
    });

    return () => unsubscribe();
  }, []);

  // Lọc user theo nhóm
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      switch (filterRole) {
        case "pending":
          return u.role === "pending" || u.status === "pending";
        case "guest":
          return u.role === "guest";
        case "member":
          return u.role === "member";
        case "associate":
          return u.role === "associate";
        case "all":
        default:
          return true;
      }
    });
  }, [users, filterRole]);

  // Chọn / bỏ chọn 1 user
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Chọn / bỏ chọn tất cả user đang hiển thị
  const toggleSelectAll = () => {
    if (filteredUsers.length === 0) return;

    const currentIds = filteredUsers.map((u) => u.id);
    const allSelected =
      currentIds.every((id) => selectedIds.includes(id)) &&
      selectedIds.length === currentIds.length;

    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentIds);
    }
  };

  // Hàm chung: cập nhật role/status nhiều user 1 lần
  const bulkUpdateRole = async (newRole, newStatus) => {
    if (selectedIds.length === 0) {
      alert("Bạn chưa chọn user nào.");
      return;
    }

    const confirmText =
      newRole === "guest"
        ? `Đưa ${selectedIds.length} user về Guest?`
        : `Duyệt ${selectedIds.length} user thành ${newRole.toUpperCase()}?`;

    if (!window.confirm(confirmText)) return;

    try {
      setLoadingAction(true);

      const updates = {};
      selectedIds.forEach((id) => {
        const basePath = `users/${id}`;
        updates[`${basePath}/role`] = newRole;
        updates[`${basePath}/status`] = newStatus;

        // Nếu duyệt member / associate thì gán memberId (10 ký tự) nếu chưa có
        if (newRole === "member" || newRole === "associate") {
          const user = users.find((u) => u.id === id);
          if (user && !user.memberId) {
            // tạm dùng 10 ký tự cuối của uid (hoặc id)
            const raw = (user.uid || user.id || "").toString();
            updates[`${basePath}/memberId`] = raw.slice(-10);
          }
        }
      });

      await update(ref(database), updates);
      setSelectedIds([]);
      alert("Cập nhật thành công.");
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi cập nhật. Xem console.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleApproveMember = () => bulkUpdateRole("member", "approved");
  const handleApproveAssociate = () => bulkUpdateRole("associate", "approved");
  const handleSetGuest = () => bulkUpdateRole("guest", "guest");

  return (
    <div style={{ padding: "32px" }}>
      <h1 style={{ marginBottom: 8 }}>Quản lý User</h1>
      <p>Chọn nhóm để xem và dùng checkbox + nút duyệt để đổi quyền.</p>

      {/* Thanh filter + action */}
      <div
        style={{
          marginTop: 16,
          marginBottom: 16,
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label>
          Nhóm hiển thị:{" "}
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setSelectedIds([]);
            }}
          >
            {ROLE_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <span>Đã chọn: {selectedIds.length}</span>

        <button onClick={toggleSelectAll} disabled={filteredUsers.length === 0}>
          {filteredUsers.length > 0 &&
          filteredUsers.every((u) => selectedIds.includes(u.id)) &&
          selectedIds.length === filteredUsers.length
            ? "Bỏ chọn tất cả"
            : "Chọn tất cả"}
        </button>

        <button
          onClick={handleApproveMember}
          disabled={selectedIds.length === 0 || loadingAction}
        >
          Duyệt thành Member
        </button>

        <button
          onClick={handleApproveAssociate}
          disabled={selectedIds.length === 0 || loadingAction}
        >
          Duyệt thành Associate
        </button>

        <button
          onClick={handleSetGuest}
          disabled={selectedIds.length === 0 || loadingAction}
        >
          Đưa về Guest
        </button>
      </div>

      {/* Bảng user */}
      {filteredUsers.length === 0 ? (
        <p>Không có user nào trong nhóm này.</p>
      ) : (
        <table border="1" cellPadding="6" cellSpacing="0">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={toggleSelectAll}
                  checked={
                    filteredUsers.length > 0 &&
                    filteredUsers.every((u) => selectedIds.includes(u.id)) &&
                    selectedIds.length === filteredUsers.length
                  }
                />
              </th>
              <th>Email</th>
              <th>Tên</th>
              <th>Role</th>
              <th>Status</th>
              <th>Member ID</th>
              <th>Level</th>
              <th>XP</th>
              <th>Coin</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(u.id)}
                    onChange={() => toggleSelect(u.id)}
                  />
                </td>
                <td>{u.email}</td>
                <td>{u.displayName}</td>
                <td>{u.role}</td>
                <td>{u.status || "-"}</td>
                <td>{u.memberId || "-"}</td>
                <td>{u.level}</td>
                <td>{u.xp}</td>
                <td>{u.coin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminUsers;
