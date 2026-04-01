import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  let user = null;
  let token = null;

  try {
    const storedUser = localStorage.getItem("user");
    token = localStorage.getItem("token");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Invalid user data in localStorage:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
  };

  return (
    <nav style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
      <Link to="/">Home</Link> | <Link to="/packs">Packs</Link> |{" "}
      <Link to="/collection">My Collection</Link> |{" "}
      <Link to="/leaderboard">Leaderboard</Link>{" "}
      {!token && (
        <>
          | <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
        </>
      )}
      {token && (
        <>
          {" "} | <span>Logged in as: {user?.username || "User"}</span>
        </>
      )}
      {user?.role === "admin" && (
        <>
          {" "} | <Link to="/admin">Admin</Link>
        </>
      )}
      {token && (
        <>
          {" "} | <button onClick={logout}>Logout</button>
        </>
      )}
    </nav>
  );
}