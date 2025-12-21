
// js/ung-dung/ui-join.js
// Render giao dien Cong thanh vien
// Goi toi membershipData de gui yeu cau

import { requestMembership } from "../data/membershipData.js";
import { getUserDocument } from "../data/userData.js";

export function renderJoinGate(container, firebaseUser, profile, onProfileUpdate, setStatus) {
  if (!firebaseUser || !profile) {
    container.innerHTML = "<p>Ban can dang nhap truoc.</p>";
    return;
  }

  const p = profile;

  // Truong hop admin
  if (p.role === "admin") {
    container.innerHTML = `
      <p>Ban la <strong>admin</strong>. Khong can gui yeu cau thanh vien.</p>
      <p>Hay su dung khu Admin de duyet cac user khac.</p>
    `;
    return;
  }

  // Truong hop da approved
  if (p.status === "approved" && p.role !== "guest") {
    container.innerHTML = `
      <p>Chuc mung, ban da la <strong>${p.role}</strong>.</p>
      ${
        p.joinCode
          ? `<p>Join code cua ban: <strong>${p.joinCode}</strong></p>`
          : ""
      }
      <p>Ban co the quay lai Dashboard de xem chi so tien trinh.</p>
    `;
    return;
  }

  // Pending
  if (p.status === "pending") {
    container.innerHTML = `
      <p>Ban da gui yeu cau tro thanh member.</p>
      <p>Trang thai: <strong>pending</strong>. Vui long cho admin duyet.</p>
    `;
    return;
  }

  // Rejected hoac none
  const isRejected = p.status === "rejected";

  container.innerHTML = `
    <p>Ban hien la <strong>${p.role}</strong>, status: <strong>${p.status}</strong>.</p>
    <p>
      ${
        isRejected
          ? "Yeu cau truoc day cua ban da bi tu choi. Neu da dat du dieu kien, ban co the gui lai yeu cau."
          : "Neu ban da hoan thanh cac dieu kien (sub kenh, tham gia hoat dong...), hay gui yeu cau de tro thanh member."
      }
    </p>
    <button id="join-request-btn" class="btn btn-primary">
      ${isRejected ? "Gui lai yeu cau thanh vien" : "Gui yeu cau tro thanh member"}
    </button>
  `;

  const btn = document.getElementById("join-request-btn");
  if (btn) {
    btn.addEventListener("click", async () => {
      try {
        btn.disabled = true;
        btn.textContent = "Dang gui yeu cau...";
        await requestMembership(firebaseUser.uid);
        setStatus("Da gui yeu cau. Vui long cho admin duyet.");
        // Doc lai profile moi
        const fresh = await getUserDocument(firebaseUser.uid);
        if (fresh) {
          onProfileUpdate(fresh);
        }
      } catch (err) {
        console.error(err);
        alert("Gui yeu cau that bai");
      } finally {
        btn.disabled = false;
      }
    });
  }
}
