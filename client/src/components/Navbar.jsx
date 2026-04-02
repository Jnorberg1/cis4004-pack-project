import { Link, useLocation } from "react-router-dom";

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Invalid user data in localStorage:", error);
    localStorage.removeItem("user");
    return null;
  }
}

export default function Navbar() {
  const { pathname } = useLocation();
  const user = readStoredUser();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <nav className="navbar" data-route={pathname}>
      <div className="navbar-brand">
        <Link to="/">PackThreads</Link>
      </div>

      <div className="navbar-links">
        <Link to="/packs">Packs</Link>
        <Link to="/collection">My Collection</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/trading">Trading</Link>
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        {user && (
          <span className="navbar-username">{user.username}</span>
        )}
        {user && (
          <button type="button" className="btn-secondary" onClick={logout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
