/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import api from "../api/api";
import ShirtImage from "../components/ShirtImage";

function currentUserId() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.id ?? null;
  } catch {
    return null;
  }
}

function shirtLabel(entry) {
  const s = entry?.shirt;
  if (!s) return "Unknown shirt";
  const rarity = s.rarity?.name ? ` (${s.rarity.name})` : "";
  return `${s.name}${rarity}`;
}

export default function TradingPage() {
  const [myItems, setMyItems] = useState([]);
  const [peerPayload, setPeerPayload] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedMine, setSelectedMine] = useState(null);
  const [selectedTheirs, setSelectedTheirs] = useState(null);
  const [trades, setTrades] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const me = currentUserId();

  const loadMine = useCallback(async () => {
    try {
      const res = await api.get("/collection");
      setMyItems(res.data);
      setErrorMessage("");
    } catch (error) {
      if (error.response?.status === 401) {
        setErrorMessage("Log in to use trading.");
      } else {
        setErrorMessage("Could not load your collection.");
      }
      setMyItems([]);
    }
  }, []);

  const loadTrades = useCallback(async () => {
    try {
      const res = await api.get("/trades");
      setTrades(res.data);
    } catch (error) {
      console.error("Trades fetch error:", error);
    }
  }, []);

  useEffect(() => {
    loadMine();
    loadTrades();
  }, [loadMine, loadTrades]);

  const loadPeer = async (e) => {
    e?.preventDefault();
    const name = searchInput.trim();
    if (!name) return;

    setStatusMessage("");
    try {
      const res = await api.get(`/collection/user/${encodeURIComponent(name)}`);
      setPeerPayload(res.data);
      setSelectedTheirs(null);
      setErrorMessage("");
    } catch (error) {
      setPeerPayload(null);
      setErrorMessage(
        error.response?.data?.message || "Could not load that user's collection."
      );
    }
  };

  const proposeTrade = async () => {
    if (!peerPayload?.user?.username || !selectedMine || !selectedTheirs) {
      setStatusMessage("Pick one of your shirts and one of theirs.");
      return;
    }

    setStatusMessage("");
    try {
      await api.post("/trades", {
        toUsername: peerPayload.user.username,
        myEntryId: selectedMine,
        theirEntryId: selectedTheirs,
      });
      setStatusMessage("Trade proposed.");
      await loadMine();
      await loadTrades();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Could not create trade.");
    }
  };

  const acceptTrade = async (id) => {
    try {
      await api.post(`/trades/${id}/accept`);
      await loadMine();
      await loadTrades();
      setStatusMessage("Trade accepted. Shirts swapped.");
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Could not accept trade.");
    }
  };

  const declineTrade = async (id) => {
    try {
      await api.post(`/trades/${id}/decline`);
      await loadTrades();
      setStatusMessage("Trade declined.");
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Could not decline trade.");
    }
  };

  const cancelTrade = async (id) => {
    try {
      await api.post(`/trades/${id}/cancel`);
      await loadTrades();
      setStatusMessage("Trade cancelled.");
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Could not cancel trade.");
    }
  };

  if (!me) {
    return (
      <div className="page">
        <h1>Trading</h1>
        <p>You need to log in to propose and manage trades.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Trading</h1>
      <p style={{ marginBottom: "1rem", opacity: 0.9 }}>
        Propose a one-for-one swap: you offer one shirt from your collection for one
        of another user&apos;s shirts. They accept or decline from their account.
      </p>

      {errorMessage && (
        <p style={{ color: "#ff8a8a", marginBottom: "0.75rem" }}>{errorMessage}</p>
      )}
      {statusMessage && (
        <p style={{ color: "var(--primary)", marginBottom: "0.75rem" }}>{statusMessage}</p>
      )}

      <section
        style={{
          marginBottom: "2rem",
          padding: "1rem",
          border: "1px solid #343434",
          borderRadius: "0.65rem",
        }}
      >
        <h2 style={{ marginBottom: "0.75rem", fontSize: "1.1rem" }}>
          Find a collector
        </h2>
        <form onSubmit={loadPeer} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Username"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ flex: "1 1 200px", maxWidth: "320px" }}
          />
          <button type="submit" className="btn-primary">
            Load collection
          </button>
        </form>
      </section>

      <div className="grid" style={{ marginBottom: "2rem" }}>
        <section>
          <h2 style={{ marginBottom: "0.75rem", fontSize: "1.1rem" }}>You offer</h2>
          {myItems.length === 0 ? (
            <p>Open packs to add shirts you can trade.</p>
          ) : (
            <ul className="list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {myItems.map((item) => (
                <li key={item._id}>
                  <button
                    type="button"
                    className={`list-item ${selectedMine === item._id ? "collection-item" : ""}`}
                    onClick={() => setSelectedMine(item._id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      cursor: "pointer",
                      border: selectedMine === item._id ? "2px solid var(--primary)" : undefined,
                      background: "#181818",
                      color: "inherit",
                      font: "inherit",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                    }}
                  >
                    <ShirtImage
                      src={item.shirt?.image}
                      alt={item.shirt?.name || "Shirt"}
                      size="sm"
                    />
                    <span>
                      <strong>{shirtLabel(item)}</strong>
                      <div style={{ fontSize: "0.85rem", opacity: 0.85 }}>
                        Value: {item.shirt?.valueScore ?? "—"}
                      </div>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 style={{ marginBottom: "0.75rem", fontSize: "1.1rem" }}>You want</h2>
          {!peerPayload && <p>Search a username to see their shirts.</p>}
          {peerPayload && peerPayload.items.length === 0 && (
            <p>That user has no shirts in their collection yet.</p>
          )}
          {peerPayload && peerPayload.items.length > 0 && (
            <ul className="list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {peerPayload.items.map((item) => (
                <li key={item._id}>
                  <button
                    type="button"
                    onClick={() => setSelectedTheirs(item._id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      cursor: "pointer",
                      border: selectedTheirs === item._id ? "2px solid var(--primary)" : undefined,
                      background: "#181818",
                      color: "inherit",
                      font: "inherit",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                    }}
                    className="list-item"
                  >
                    <ShirtImage
                      src={item.shirt?.image}
                      alt={item.shirt?.name || "Shirt"}
                      size="sm"
                    />
                    <span>
                      <strong>{shirtLabel(item)}</strong>
                      <div style={{ fontSize: "0.85rem", opacity: 0.85 }}>
                        Value: {item.shirt?.valueScore ?? "—"}
                      </div>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={proposeTrade}
        style={{ marginBottom: "2rem" }}
        disabled={!peerPayload || !selectedMine || !selectedTheirs}
      >
        Propose trade
      </button>

      <section>
        <h2 style={{ marginBottom: "0.75rem", fontSize: "1.1rem" }}>Your trades</h2>
        {trades.length === 0 && <p>No trades yet.</p>}
        <ul className="list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {trades.map((t) => {
            const incoming =
              String(t.toUser?._id ?? t.toUser ?? "") === String(me);
            const youGive = incoming ? t.toEntry : t.fromEntry;
            const theyGive = incoming ? t.fromEntry : t.toEntry;
            const partner = incoming ? t.fromUser?.username : t.toUser?.username;

            return (
              <li
                key={t._id}
                className="list-item"
                style={{ display: "grid", gap: "0.5rem" }}
              >
                <div>
                  <strong>{t.status}</strong>
                  <span style={{ opacity: 0.8 }}>
                    {" "}
                    · with <strong>{partner || "?"}</strong>
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <ShirtImage
                      src={youGive?.shirt?.image}
                      alt={shirtLabel(youGive)}
                      size="sm"
                    />
                    <span style={{ fontSize: "0.9rem" }}>
                      You give: {shirtLabel(youGive)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <ShirtImage
                      src={theyGive?.shirt?.image}
                      alt={shirtLabel(theyGive)}
                      size="sm"
                    />
                    <span style={{ fontSize: "0.9rem" }}>
                      They give: {shirtLabel(theyGive)}
                    </span>
                  </div>
                </div>
                {t.status === "pending" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {incoming ? (
                      <>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => acceptTrade(t._id)}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => declineTrade(t._id)}
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => cancelTrade(t._id)}
                      >
                        Cancel proposal
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
