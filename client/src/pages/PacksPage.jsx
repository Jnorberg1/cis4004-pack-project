import { useEffect, useState } from "react";
import api from "../api/api";

export default function PacksPage() {
  const [packs, setPacks] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchPacks = async () => {
      const res = await api.get("/packs");
      setPacks(res.data);
    };
    fetchPacks();
  }, []);

  const handleOpenPack = async (packId) => {
    try {
      const res = await api.post(`/packs/open/${packId}`);
      setResults(res.data.results);
    } catch (error) {
      alert(error.response?.data?.message || "Could not open pack");
    }
  };

  return (
    <section className="page">
      <h1>Packs</h1>
      {packs.length === 0 && <p className="card">No packs yet.</p>}

      <div className="grid">
        {packs.map((pack) => (
          <div key={pack._id} className="card pack-card">
          <h3>{pack.name}</h3>
          <p>{pack.description}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleOpenPack(pack._id)}
            >
              Open Pack
            </button>
          </div>
        ))}
      </div>

      <h2>Latest Pull</h2>
      <div className="list">
        {results.map((shirt) => (
          <div key={shirt._id} className="list-item">
            {shirt.name}
          </div>
        ))}
      </div>
    </section>
  );
}