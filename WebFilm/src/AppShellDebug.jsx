// AppShellDebug.jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

const HeaderBar = () => (
  <header
    className="site-header"
    style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      height: 64,
      zIndex: 9999,
      background: "#4a2c2a",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "0 20px",
      boxShadow: "0 2px 8px rgba(0,0,0,.1)"
    }}
  >
    <strong>🎬 WebPhim (DEBUG)</strong>
    <nav style={{ display: "flex", gap: 12 }}>
      <Link to="/" style={{ color: "#fff" }}>Home</Link>
      <Link to="/debug" style={{ color: "#fff" }}>Debug</Link>
    </nav>
  </header>
);

const TallPage = () => (
  <div style={{ padding: 24 }}>
    <h1>Trang rất dài</h1>
    <p>Phần đầu này KHÔNG được phép bị che.</p>
    <div style={{ height: "200vh", background: "#fafafa", marginTop: 16, border: "1px dashed #ccc" }} />
  </div>
);

export default function AppShellDebug() {
  return (
    <Router>
      <HeaderBar />
      {/* Spacer chừa chỗ cho header fixed */}
      <div style={{ height: 64 }} />
      <main className="site-main" style={{ minHeight: "100vh" }}>
        <Routes>
          <Route path="/" element={<TallPage />} />
          <Route path="/debug" element={<TallPage />} />
        </Routes>
      </main>
      <footer style={{ textAlign: "center", padding: 12, background: "#4a2c2a", color: "#fff" }}>
        Footer (DEBUG)
      </footer>
    </Router>
  );
}
