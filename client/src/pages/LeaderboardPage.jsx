import { useEffect, useState } from "react";
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

      {leaders.length === 0 && <p>No leaderboard data yet.</p>}

      {leaders.map((entry, index) => (
        <div
          key={entry._id || index}
          style={{
            border: "1px solid #ccc",
            padding: "12px",
            marginBottom: "12px",
          }}
        >
          <h3>
            #{index + 1} {entry.shirtName}
          </h3>
          <p><strong>Brand:</strong> {entry.brand}</p>
          <p><strong>Rarity:</strong> {entry.rarityName || "Unknown"}</p>
          <p><strong>Value Score:</strong> {entry.valueScore}</p>
          <p><strong>Total Pulls:</strong> {entry.pullCount}</p>
          <p><strong>Favorites:</strong> {entry.favoriteCount}</p>
          <p>{entry.description}</p>
        </div>
      ))}
    </div>
  );
}