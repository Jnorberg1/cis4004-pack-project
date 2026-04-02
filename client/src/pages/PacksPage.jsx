import { useEffect, useState } from "react";
import api from "../api/api";
import ShirtImage from "../components/ShirtImage";

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
      setResults(res.data.collectionEntries || []);
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
            {pack.shirtPool?.length > 0 && (
              <div className="pack-shirt-pool" aria-label="Shirts in this pack">
                {pack.shirtPool.map((shirt) => (
                  <ShirtImage
                    key={shirt._id}
                    src={shirt.image}
                    alt={shirt.name || "Shirt in pack"}
                    size="sm"
                  />
                ))}
              </div>
            )}
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
        {results.map((entry) => {
          const shirt = entry.shirt || {};
          return (
            <div
              key={entry._id}
              className="list-item collection-item-row"
              style={{ alignItems: "center" }}
            >
              <ShirtImage src={shirt.image} alt={shirt.name} size="sm" />
              <div>
                <strong>{shirt.name}</strong>
                <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                  Tag: {entry.tag || "Gildan"}
                  {entry.singleStitch ? " · Single stitch" : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}