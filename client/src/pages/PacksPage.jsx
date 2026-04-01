import { useEffect, useState } from "react";
import api from "../api/api";

export default function PacksPage() {
  const [packs, setPacks] = useState([]);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const res = await api.get("/packs");
        setPacks(res.data);
      } catch (error) {
        console.error("Error fetching packs:", error);
      }
    };

    fetchPacks();
  }, []);

  const handleOpenPack = async (packId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("You must be logged in to open packs.");
      return;
    }

    try {
      const res = await api.post(`/packs/open/${packId}`);
      setResults(res.data.results);
      setMessage("Pack opened successfully.");
    } catch (error) {
      console.error("Error opening pack:", error);

      if (error.response?.status === 401) {
        setMessage("You must be logged in to open packs.");
      } else {
        setMessage("Could not open pack.");
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Packs</h1>

      {message && <p>{message}</p>}
      {packs.length === 0 && <p>No packs yet.</p>}

      {packs.map((pack) => (
        <div key={pack._id} style={{ marginBottom: "20px" }}>
          <h3>{pack.name}</h3>
          <p>{pack.description}</p>
          <button onClick={() => handleOpenPack(pack._id)}>Open Pack</button>
        </div>
      ))}

      <h2>Latest Pull</h2>
      {results.map((shirt) => (
        <div key={shirt._id}>{shirt.name}</div>
      ))}
    </div>
  );
}