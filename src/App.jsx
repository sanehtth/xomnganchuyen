// src/App.jsx
import "./theme.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";

import LoginPage from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import JoinGate from "./pages/JoinGate.jsx";
import AdminPanel from "./pages/admin/AdminPanel.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";

function Home() {
  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Fanpage Core System</h1>
        <p>
          Đây là bản nền: đăng nhập, quản lý user cơ bản và khu admin để bạn
          gắn thêm tool (video, quiz, nhiệm vụ, vinh danh...).
        </p>

        <div className="mt-2">
          <Link to="/login" className="btn">
            Đăng nhập
          </Link>

          <span style={{ marginLeft: 8 }} />

          <Link to="/dashboard" className="btn outline">
            Vào Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* user */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/join-gate" element={<JoinGate />} />

        {/* admin */}
        <Route path="/admin-tools" element={<AdminPanel />} />
        <Route path="/admin/users" element={<AdminUsers />} />

        {/* fallback 404 */}
        <Route
          path="*"
          element={
            <main className="app-shell">
              <div className="max-w">
                <h1>404</h1>
                <p>Không tìm thấy trang.</p>
                <Link to="/" className="btn">
                  Về trang chính
                </Link>
              </div>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
