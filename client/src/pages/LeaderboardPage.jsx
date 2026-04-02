import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get("/leaderboard");
        setLeaders(res.data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Leaderboard</h1>
      <p style={{ marginBottom: "1rem", opacity: 0.9, maxWidth: "520px" }}>
        Collectors ranked by how many shirts they own. Select someone to browse
        their shelf and start a trade.
      </p>

      {leaders.length === 0 && <p>No users yet.</p>}

      <ul className="list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {leaders.map((row, index) => (
          <li key={row.userId || row._id || index}>
            <Link
              to={`/leaderboard/user/${encodeURIComponent(row.username)}`}
              className="list-item"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span>
                <strong>#{index + 1}</strong> {row.username}
                {row.role === "admin" ? (
                  <span style={{ opacity: 0.7, fontSize: "0.85rem" }}> · admin</span>
                ) : null}
              </span>
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                {row.shirtCount} {row.shirtCount === 1 ? "shirt" : "shirts"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
