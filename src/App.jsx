import "./theme.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import { Navbar } from "./components/Navbar.jsx";
import { LoginPage } from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import JoinGate from "./pages/JoinGate.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";


function Home() {
  return (
    <main className="app-shell">
      <div className="max-w">
        <h1>Fanpage Core System</h1>
        <p className="mt-2">
          Welcome...
        </p>
        <div className="mt-3 flex gap-2">
          <Link className="btn" to="/login">Đăng nhập</Link>
          <Link className="btn outline" to="/dashboard">Dashboard</Link>
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
          <Route path="/" element={<Home/>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard/>} />

          {/* admin */}
          <Route path="/admin/users" element={<AdminUsers/>} />

          {/* Join gate */}
          <Route path="/join-gate" element={<JoinGate/>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
