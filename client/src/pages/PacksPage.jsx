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

function packIdStr(pack) {
  if (!pack) return "";
  return String(pack._id ?? pack);
}

export default function PacksPage() {
  const [packs, setPacks] = useState([]);
  const [results, setResults] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [availTick, setAvailTick] = useState(0);

  const loggedIn = Boolean(
    typeof localStorage !== "undefined" && localStorage.getItem("token")
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const packsRes = await api.get("/packs");
        if (!cancelled) setPacks(packsRes.data);
      } catch {
        if (!cancelled) setPacks([]);
      }
      const token = localStorage.getItem("token");
      if (!token) {
        if (!cancelled) setAvailability(null);
        return;
      }
      try {
        const res = await api.get("/packs/my-availability");
        if (!cancelled) setAvailability(res.data);
      } catch {
        if (!cancelled) setAvailability(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [availTick]);

  const canOpenPack = (packId) => {
    if (!availability) return false;
    const pid = String(packId);
    const bonus = availability.bonusCounts?.[pid] || 0;
    if (bonus > 0) return true;
    const slots = availability.slots || [];
    return slots.some(
      (s) => packIdStr(s.pack) === pid && !s.opened
    );
  };

  const handleOpenPack = async (packId) => {
    try {
      const res = await api.post(`/packs/open/${packId}`);
      const entries = res.data.collectionEntries || [];
      setResults(entries);
      setAvailTick((t) => t + 1);

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

      {!loggedIn && (
        <p className="card" style={{ marginBottom: "1rem" }}>
          Log in to open packs. Each day (UTC) you get <strong>two random</strong>{" "}
          pack drops from the catalog; admins can also grant bonus opens.
        </p>
      )}

      {loggedIn && availability && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <p style={{ margin: "0 0 0.5rem" }}>
            <strong>Today&apos;s drops (UTC)</strong> — two random pack types. Open
            only the pack shown in each slot (or use a bonus for that pack).
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            {(availability.slots || []).map((s, i) => {
              const name = s.pack?.name || "Pack";
              return (
                <li key={i}>
                  Slot {i + 1}: {name}
                  {s.opened ? " — opened" : " — ready"}
                </li>
              );
            })}
          </ul>
          {Object.keys(availability.bonusCounts || {}).length > 0 && (
            <p style={{ margin: "0.75rem 0 0" }}>
              <strong>Bonus opens:</strong>{" "}
              {Object.entries(availability.bonusCounts)
                .map(([id, n]) => {
                  const p = packs.find((x) => String(x._id) === id);
                  return `${p?.name || id} ×${n}`;
                })
                .join(", ")}
            </p>
          )}
        </div>
      )}

      {packs.length === 0 && <p className="card">No packs yet.</p>}

      <div className="grid">
        {packs.map((pack) => {
          const allowed = loggedIn && canOpenPack(pack._id);
          return (
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
                disabled={!allowed}
                title={
                  !loggedIn
                    ? "Log in to open packs"
                    : allowed
                      ? "Use one daily slot or bonus for this pack"
                      : "No open available for this pack (check today’s slots or bonuses)"
                }
                onClick={() => handleOpenPack(pack._id)}
              >
                Open pack
              </button>
            </div>
          );
        })}
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
