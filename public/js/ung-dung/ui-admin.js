// public/js/ung-dung/ui-admin.js
import { listUsers, approveUser, rejectUser, ensureJoinCodes, syncRealtimeToFirestore } from "../data/membershipData.js";

function esc(s) {
  return String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

export async function renderAdminView({ container, firebaseUser, profile }) {
  if (!container) return;

  const isAdmin = (profile?.role || "").toLowerCase() === "admin";
  if (!firebaseUser || !isAdmin) {
    container.innerHTML = `
      <h1>Admin Panel</h1>
      <p>Bạn không có quyền truy cập.</p>
    `;
    return;
  }

  container.innerHTML = `
    <h1>Admin Panel</h1>
    <div class="card">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button id="btnReloadUsers">Tải danh sách</button>
        <button id="btnEnsureJoinCodes">Tạo joinCode cho user thiếu</button>
        <button id="btnSyncSelected">Sync RTDB -> Firestore (S_)</button>
      </div>
      <div style="margin-top:10px;overflow:auto">
        <table style="width:100%;border-collapse:collapse" id="adminUserTable">
          <thead>
            <tr style="text-align:left;border-bottom:1px solid #ddd">
              <th></th><th>Email</th><th>Tên</th><th>Role</th><th>Status</th><th>ID</th><th>JoinCode</th><th>Hành động</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <div id="adminMsg" style="margin-top:10px;opacity:.8"></div>
    </div>
  `;

  const tbody = container.querySelector("#adminUserTable tbody");
  const msg = container.querySelector("#adminMsg");

  const load = async () => {
    if (msg) msg.textContent = "Đang tải...";
    const users = await listUsers();
    if (!tbody) return;
    tbody.innerHTML = users.map(u => `
      <tr style="border-bottom:1px solid #f0f0f0">
        <td><input type="checkbox" class="chkUser" data-uid="${esc(u.uid)}"/></td>
        <td>${esc(u.email)}</td>
        <td>${esc(u.displayName)}</td>
        <td>${esc(u.role)}</td>
        <td>${esc(u.status)}</td>
        <td>${esc(u.id)}</td>
        <td>${esc(u.joinCode)}</td>
        <td>
          <select class="selRole" data-uid="${esc(u.uid)}">
            <option value="guest" ${u.role==="guest"?"selected":""}>guest</option>
            <option value="member" ${u.role==="member"?"selected":""}>member</option>
            <option value="admin" ${u.role==="admin"?"selected":""}>admin</option>
          </select>
          <button class="btnApprove" data-uid="${esc(u.uid)}">Duyệt</button>
          <button class="btnReject" data-uid="${esc(u.uid)}">Từ chối</button>
        </td>
      </tr>
    `).join("");
    if (msg) msg.textContent = `Đã tải: ${users.length} user.`;
  };

  const getSelectedUids = () => Array.from(container.querySelectorAll(".chkUser:checked")).map(i => i.dataset.uid);

  container.querySelector("#btnReloadUsers")?.addEventListener("click", load);

  container.addEventListener("click", async (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    if (t.classList.contains("btnApprove")) {
      const uid = t.dataset.uid;
      const roleSel = container.querySelector(`.selRole[data-uid="${uid}"]`);
      const role = roleSel?.value || "member";
      try {
        await approveUser(uid, role);
        if (msg) msg.textContent = "Đã duyệt.";
        await load();
      } catch (err) {
        console.error(err);
        if (msg) msg.textContent = "Lỗi khi duyệt.";
      }
    }

    if (t.classList.contains("btnReject")) {
      const uid = t.dataset.uid;
      try {
        await rejectUser(uid);
        if (msg) msg.textContent = "Đã từ chối.";
        await load();
      } catch (err) {
        console.error(err);
        if (msg) msg.textContent = "Lỗi khi từ chối.";
      }
    }
  });

  container.querySelector("#btnEnsureJoinCodes")?.addEventListener("click", async () => {
    try {
      const uids = (await listUsers()).map(u => u.uid);
      const n = await ensureJoinCodes(uids);
      if (msg) msg.textContent = `Đã tạo joinCode cho ${n} user.`;
      await load();
    } catch (err) {
      console.error(err);
      if (msg) msg.textContent = "Lỗi khi tạo joinCode.";
    }
  });

  container.querySelector("#btnSyncSelected")?.addEventListener("click", async () => {
    const uids = getSelectedUids();
    if (!uids.length) { if (msg) msg.textContent = "Chọn ít nhất 1 user để sync."; return; }
    let ok = 0, fail = 0;
    for (const uid of uids) {
      try {
        const r = await syncRealtimeToFirestore(uid);
        if (r?.ok) ok++; else fail++;
      } catch (e) { fail++; }
    }
    if (msg) msg.textContent = `Sync xong: ok=${ok}, fail=${fail}`;
    await load();
  });

  await load();
}
