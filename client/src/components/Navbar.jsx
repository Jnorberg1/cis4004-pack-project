import { Link } from "react-router-dom";

export default function Navbar() {
  let user = null;

  try {
    const storedUser = localStorage.getItem("user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Invalid user data in localStorage:", error);
    localStorage.removeItem("user");
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">PackThreads</Link>
      </div>

      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/packs">Packs</Link>
        <Link to="/collection">My Collection</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/trading">Trading</Link>
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        {user && (
          <button type="button" className="btn-secondary" onClick={logout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}