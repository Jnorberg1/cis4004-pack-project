import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import PacksPage from "./pages/PacksPage";
import CollectionPage from "./pages/CollectionPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LeaderboardUserPage from "./pages/LeaderboardUserPage";
import TradingPage from "./pages/TradingPage";
import AdminDashboard from "./pages/AdminDashboard";
import Navbar from "./components/Navbar";
import RequireAuth from "./components/RequireAuth";
import GuestOnly from "./components/GuestOnly";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-container">
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<RequireAuth />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/packs" element={<PacksPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/leaderboard/user/:username" element={<LeaderboardUserPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/trading" element={<TradingPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}