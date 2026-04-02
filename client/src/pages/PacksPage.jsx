import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import api from "../api/api";
import ShirtImage from "../components/ShirtImage";

const GOLD_COLORS = ["#FFD700", "#d4af37", "#F4C430", "#fcc904", "#e8c547"];

function celebrateSingleStitchPull() {
  const fire = (opts) =>
    confetti({
      colors: GOLD_COLORS,
      ticks: 220,
      gravity: 1.05,
      scalar: 1.05,
      ...opts,
    });

  fire({
    particleCount: 110,
    spread: 70,
    origin: { y: 0.58 },
  });

  setTimeout(() => {
    fire({
      particleCount: 55,
      angle: 55,
      spread: 50,
      origin: { x: 0, y: 0.62 },
    });
    fire({
      particleCount: 55,
      angle: 125,
      spread: 50,
      origin: { x: 1, y: 0.62 },
    });
  }, 180);
}

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
      const entries = res.data.collectionEntries || [];
      setResults(entries);

      const hasSingleStitch = entries.some((e) => e.singleStitch);
      if (hasSingleStitch) {
        celebrateSingleStitchPull();
      }
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

      <h2>Latest pull</h2>

      <div className="list">
        {results.map((entry) => {
          const shirt = entry.shirt || {};
          const ss = Boolean(entry.singleStitch);
          return (
            <div
              key={entry._id}
              className={`list-item collection-item-row${
                ss ? " collection-card--single-stitch" : ""
              }`}
              style={{ alignItems: "center" }}
            >
              <ShirtImage src={shirt.image} alt={shirt.name} size="sm" />
              <div>
                <strong>{shirt.name}</strong>
                {ss && (
                  <p className="collection-card__single-stitch-badge">
                    Single stitch
                  </p>
                )}
                <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                  Tag: {entry.tag || "Gildan"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
