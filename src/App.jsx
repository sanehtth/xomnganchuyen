import "./theme.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Navbar } from "./components/Navbar.jsx";
import { LoginPage } from "./pages/Login.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { AdminPanel } from "./pages/AdminPanel.jsx";
import { AdminUsers } from "./pages/AdminUsers.jsx";
import JoinGate from "./pages/JoinGate";
import AdminUsers from "./pages/admin/AdminUsers";

function Home() {
  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Fanpage Core System</h1>
        <p className="mt-2">
          Đây là bản nền: đăng nhập, quản lý user cơ bản và khu admin để bạn
          gắn thêm tool (video, quiz, nhiệm vụ, vinh danh...).
        </p>
        <div className="mt-3 flex gap-2">
          <Link className="btn" to="/login">Đăng nhập</Link>
          <Link className="btn outline" to="/dashboard">Vào Dashboard</Link>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <Routes>

<Route path="/join-gate" element={<JoinGate/>} />

<Route path="/admin/users" element={
   isAdmin ? <AdminUsers/> : <h1>Forbidden</h1>
}/>

</Routes>

      </div>
    </BrowserRouter>
  );
}
