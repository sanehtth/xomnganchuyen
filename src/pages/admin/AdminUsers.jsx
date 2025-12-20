// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "../../firebase";
import { useAuth } from "../../AuthContext";

// Tạo ID 10 ký tự không trùng joinCode
async function generateUniqueMemberId(existingCodes) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  function randomId() {
    let res = "";
    for (let i = 0; i < 10; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
  }

  let candidate;
  const used = new Set(existingCodes || []);

  while (true) {
    candidate = randomId();
    if (!used.has(candidate)) return candidate;
  }
}

const ROLE_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "guest", label: "Guest" },
  { value: "member", label: "Member (VIP)" },
  { value: "associate", label: "Associate (Cộng sự)" },
  { value: "admin", label: "Admin" },
];

const STATUS_FILTERS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "none", label: "Chưa gửi yêu cầu" },
  { value: "pending", label: "Đang chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
];

export default function AdminUsers() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    const usersCol = collection(firestore, "users");
    const unsub = onSnapshot(usersCol, (snap) => {
      const list = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          ...data,
        });
      });

      // sort by createdAt desc
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setUsers(list);
      setLoading(false);
    });

    return () => unsub();
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterRole !== "all" && u.role !== filterRole) return false;
      if (filterStatus !== "all" && u.status !== filterStatus) return false;

      if (search.trim()) {
        const s = search.trim().toLowerCase();
        const haystack =
          (u.displayName || "").toLowerCase() +
          " " +
          (u.email || "").toLowerCase() +
          " " +
          (u.joinCode || "").toLowerCase();
        if (!haystack.includes(s)) return false;
      }

      return true;
    });
  }, [users, filterRole, filterStatus, search]);

  const toggleSelect = (uid) => {
    setSelectedIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredUsers.map((u) => u.id);
    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) =>
        Array.from(new Set([...prev, ...visibleIds]))
      );
    }
  };

  // DUYỆT USER THÀNH MEMBER/ASSOCIATE
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

      // Lấy toàn bộ joinCode hiện có để tránh trùng
      const allJoinCodes = users
        .map((u) => u.joinCode)
        .filter((c) => !!c);

      const batch = writeBatchWithLimit();

      for (const uid of selectedIds) {
        const u = users.find((x) => x.id === uid);
        if (!u) continue;

        const ref = doc(firestore, "users", uid);

        // Nếu chưa có joinCode -> tạo mới
        let joinCode = u.joinCode || "";
        if (!joinCode) {
          joinCode = await generateUniqueMemberId(allJoinCodes);
          allJoinCodes.push(joinCode);
        }

        batch.update(ref, {
          role: roleTarget,
          status: "approved",
          joinCode,
        });
      }

      await batch.commit();
      alert("Duyệt thành công.");
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
      alert("Có lỗi xảy ra khi duyệt user.");
    } finally {
      setLoadingAction(false);
    }
  };

  // TẠO ID CHO USER ĐÃ DUYỆT NHƯNG THIẾU joinCode
  const handleCreateMissingIds = async () => {
    const ok = window.confirm(
      "Tạo ID cho tất cả user đã duyệt nhưng thiếu ID?"
    );
    if (!ok) return;

    try {
      setLoadingAction(true);

      const allJoinCodes = users
        .map((u) => u.joinCode)
        .filter((c) => !!c);

      const batch = writeBatchWithLimit();
      let count = 0;

      for (const u of users) {
        const approved =
          u.status === "approved" &&
          (u.role === "member" || u.role === "associate" || u.role === "admin");

        if (approved && !u.joinCode) {
          const joinCode = await generateUniqueMemberId(allJoinCodes);
          allJoinCodes.push(joinCode);
          const ref = doc(firestore, "users", u.id);
          batch.update(ref, { joinCode });
          count++;
        }
      }

      if (count === 0) {
        alert("Không có user nào thiếu ID.");
        return;
      }

      await batch.commit();
      alert(`Đã tạo ID cho ${count} user.`);
    } catch (e) {
      console.error(e);
      alert("Có lỗi khi tạo ID.");
    } finally {
      setLoadingAction(false);
    }
  };

  if (!isAdmin) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <h1>Admin</h1>
          <p>Bạn không có quyền truy cập trang này.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="app-shell">
        <div className="max-w">
          <p>Đang tải danh sách user...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Quản lý User</h1>

        {/* Bộ lọc & action */}
        <div
          className="filters"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            margin: "16px 0",
            alignItems: "center",
          }}
        >
          <select
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Tìm tên / email / ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button onClick={toggleSelectAllVisible} disabled={loadingAction}>
            Chọn / Bỏ chọn tất cả
          </button>

          <button
            onClick={() => handleBulkApprove("member")}
            disabled={loadingAction}
          >
            Duyệt thành Member
          </button>

          <button
            onClick={() => handleBulkApprove("associate")}
            disabled={loadingAction}
          >
            Duyệt thành Associate
          </button>

          <button
            onClick={handleCreateMissingIds}
            disabled={loadingAction}
          >
            Tạo ID cho user đã duyệt
          </button>
        </div>

        {/* Bảng user */}
        <div className="card">
          {filteredUsers.length === 0 ? (
            <p>Không có user phù hợp với bộ lọc hiện tại.</p>
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
                          selectedIds.includes(u.id)
                        )
                      }
                    />
                  </th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>XP</th>
                  <th>Coin</th>
                  <th>Level</th>
                  <th>ID</th>
                  <th>Last Active</th>
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
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.displayName}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        {u.email}
                      </div>
                    </td>
                    <td>{u.role}</td>
                    <td>{u.status}</td>
                    <td>{u.stats?.xp ?? 0}</td>
                    <td>{u.stats?.coin ?? 0}</td>
                    <td>{u.stats?.level ?? 1}</td>
                    <td>{u.joinCode || "-"}</td>
                    <td>
                      {u.lastActiveAt
                        ? new Date(u.lastActiveAt).toLocaleString()
                        : "-"}
                    </td>
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

// Firestore không có batch size quá nhỏ, nhưng để an toàn
// mình viết helper tạo 1 batch mới cho mỗi thao tác (simple).
function writeBatchWithLimit() {
  const { writeBatch } = require("firebase/firestore");
  return writeBatch(firestore);
}
