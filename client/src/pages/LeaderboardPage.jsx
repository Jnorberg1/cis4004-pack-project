import { useEffect, useState } from "react";
import api from "../api/api";

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const res = await api.get("/leaderboard");
      setLeaders(res.data);
    };
    fetchLeaderboard();
  }, []);

  return (
    <section className="page">
      <h1>Leaderboard</h1>
      <div className="list">
        {leaders.map((entry, index) => (
          <div key={entry._id || index} className="list-item">
            #{index + 1} Shirt ID: {entry._id} | Pull Count: {entry.pullCount}
          </div>
        ))}
      </div>
    </section>
  );
}