/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function shirtLabel(entry) {
  const s = entry?.shirt;
  return s?.name || "Unknown shirt";
}

function tagLine(entry) {
  const t = entry?.tag || "Gildan";
  const ss = entry?.singleStitch ? " · single stitch" : "";
  return `${t}${ss}`;
}

function idInList(list, id) {
  return list.some((x) => String(x) === String(id));
}

function toggleId(list, id) {
  const sid = String(id);
  return list.some((x) => String(x) === sid)
    ? list.filter((x) => String(x) !== sid)
    : [...list, id];
}

function formatTradeDate(t) {
  const raw = t.updatedAt || t.createdAt;
  if (!raw) return null;
  try {
    return new Date(raw).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return null;
  }
}

function TradeList({
  trades,
  me,
  onAccept,
  onDecline,
  onCancel,
  emptyLabel,
}) {
  if (trades.length === 0) {
    return (
      <p style={{ opacity: 0.85, margin: 0, fontSize: "0.9rem" }}>
        {emptyLabel || "None."}
      </p>
    );
  }

  return (
    <ul className="list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {trades.map((t) => {
        const incoming =
          String(t.toUser?._id ?? t.toUser ?? "") === String(me);
        const youGive = incoming ? t.toEntries : t.fromEntries;
        const theyGive = incoming ? t.fromEntries : t.toEntries;
        const partner = incoming ? t.fromUser?.username : t.toUser?.username;
        const dateStr = formatTradeDate(t);

        return (
          <li
            key={t._id}
            className="list-item"
            style={{ display: "grid", gap: "0.75rem" }}
          >
            <div>
              <strong>{t.status}</strong>
              <span style={{ opacity: 0.8 }}>
                {" "}
                · with <strong>{partner || "?"}</strong>
              </span>
              {dateStr && <div className="trade-card-date">{dateStr}</div>}
            </div>
            <div
              style={{
                display: "grid",
                gap: "1rem",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              }}
            >
              <TradeSideSummary entries={youGive} label="You give" />
              <TradeSideSummary entries={theyGive} label="They give" />
            </div>
            {t.status === "pending" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {incoming ? (
                  <>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => onAccept(t._id)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => onDecline(t._id)}
                    >
                      Decline
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onCancel(t._id)}
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
  );
}

function TradeSideSummary({ entries, label }) {
  const list = Array.isArray(entries) ? entries : [];
  if (list.length === 0) {
    return (
      <div style={{ fontSize: "0.9rem", opacity: 0.85 }}>
        <strong>{label}:</strong> Nothing
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <strong style={{ fontSize: "0.9rem" }}>{label}:</strong>
      {list.map((entry) => (
        <div
          key={entry._id}
          style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
        >
          <ShirtImage
            src={entry?.shirt?.image}
            alt={shirtLabel(entry)}
            size="sm"
          />
          <span style={{ fontSize: "0.9rem" }}>
            {shirtLabel(entry)}
            <span style={{ display: "block", fontSize: "0.8rem", opacity: 0.8 }}>
              {tagLine(entry)}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TradingPage() {
  const [searchParams] = useSearchParams();
  const [myItems, setMyItems] = useState([]);
  const [peerPayload, setPeerPayload] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedMineIds, setSelectedMineIds] = useState([]);
  const [selectedTheirsIds, setSelectedTheirsIds] = useState([]);
  const [trades, setTrades] = useState([]);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const me = currentUserId();

  const pendingTrades = useMemo(
    () => trades.filter((t) => t.status === "pending"),
    [trades]
  );
  const historyTrades = useMemo(
    () => trades.filter((t) => t.status !== "pending"),
    [trades]
  );
  const withUser = searchParams.get("with");

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

  const loadPeerNamed = useCallback(async (name) => {
    const n = name.trim();
    if (!n) return;

    setStatusMessage("");
    try {
      const res = await api.get(`/collection/user/${encodeURIComponent(n)}`);
      setPeerPayload(res.data);
      setSelectedTheirsIds([]);
      setErrorMessage("");
    } catch (error) {
      setPeerPayload(null);
      setErrorMessage(
        error.response?.data?.message || "Could not load that user's collection."
      );
    }
  }, []);

  useEffect(() => {
    const q = withUser?.trim();
    if (!q) return;

    const user = readStoredUser();
    setSearchInput(q);

    if (!user?.id) {
      setPeerPayload(null);
      setErrorMessage("Log in to load this trader’s shelf.");
      return;
    }

    if (q === user.username) {
      setPeerPayload(null);
      setErrorMessage("Use My Collection for your own shirts.");
      return;
    }

    setErrorMessage("");
    loadPeerNamed(q);
  }, [withUser, loadPeerNamed]);

  const loadPeer = async (e) => {
    e?.preventDefault();
    await loadPeerNamed(searchInput);
  };

  const proposeTrade = async () => {
    if (!peerPayload?.user?.username) {
      setStatusMessage("Load someone’s collection first.");
      return;
    }

    if (selectedMineIds.length === 0 && selectedTheirsIds.length === 0) {
      setStatusMessage("Select at least one shirt on your side, their side, or both.");
      return;
    }

    setStatusMessage("");
    try {
      await api.post("/trades", {
        toUsername: peerPayload.user.username,
        myEntryIds: selectedMineIds,
        theirEntryIds: selectedTheirsIds,
      });
      setStatusMessage("Trade proposed.");
      setSelectedMineIds([]);
      setSelectedTheirsIds([]);
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
      setStatusMessage("Trade accepted.");
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

  const canPropose =
    peerPayload &&
    (selectedMineIds.length > 0 || selectedTheirsIds.length > 0);

  return (
    <div className="page">
      <h1>Trading</h1>
      <p style={{ marginBottom: "1rem", opacity: 0.9 }}>
        Pick any combination of shirts on each side. One side can be empty (gift /
        one-way offer). Tap again to deselect.
      </p>

      {errorMessage && (
        <p style={{ color: "#ff8a8a", marginBottom: "0.75rem" }}>{errorMessage}</p>
      )}
      {statusMessage && (
        <p style={{ color: "var(--primary)", marginBottom: "0.75rem" }}>{statusMessage}</p>
      )}

      <div className="trading-top-bar">
        <section className="trading-find-panel">
          <h2 style={{ marginBottom: "0.75rem", fontSize: "1.1rem", marginTop: 0 }}>
            Find a collector
          </h2>
          <form onSubmit={loadPeer} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Username"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ flex: "1 1 200px", minWidth: 0 }}
            />
            <button type="submit" className="btn-primary">
              Load collection
            </button>
          </form>
        </section>

        <section className="trading-trades-panel">
          <h2 style={{ marginBottom: "0.75rem", fontSize: "1.1rem", marginTop: 0 }}>
            Your trades
          </h2>

          <div className="trading-trades-subsection">
            <button
              type="button"
              className="trading-collapse-toggle"
              onClick={() => setPendingOpen((o) => !o)}
              aria-expanded={pendingOpen}
            >
              <span>
                Pending
                {pendingTrades.length > 0 ? ` (${pendingTrades.length})` : ""}
              </span>
              <span className="trading-collapse-toggle__chevron" aria-hidden>
                {pendingOpen ? "▼" : "▶"}
              </span>
            </button>
            {pendingOpen && (
              <TradeList
                trades={pendingTrades}
                me={me}
                onAccept={acceptTrade}
                onDecline={declineTrade}
                onCancel={cancelTrade}
                emptyLabel="No pending trades."
              />
            )}
          </div>

          <div className="trading-trades-subsection">
            <button
              type="button"
              className="trading-collapse-toggle"
              onClick={() => setHistoryOpen((o) => !o)}
              aria-expanded={historyOpen}
            >
              <span>
                Trade history
                {historyTrades.length > 0 ? ` (${historyTrades.length})` : ""}
              </span>
              <span className="trading-collapse-toggle__chevron" aria-hidden>
                {historyOpen ? "▼" : "▶"}
              </span>
            </button>
            {historyOpen && (
              <TradeList
                trades={historyTrades}
                me={me}
                onAccept={acceptTrade}
                onDecline={declineTrade}
                onCancel={cancelTrade}
                emptyLabel="No completed or declined trades yet."
              />
            )}
          </div>
        </section>
      </div>

      <div className="trading-offer-panel">
        <div className="trading-propose-row">
          <button
            type="button"
            className="btn-primary"
            onClick={proposeTrade}
            disabled={!canPropose}
          >
            Propose trade
          </button>
        </div>

        <div className="grid">
        <section>
          <h2 style={{ marginBottom: "0.75rem", fontSize: "1.1rem" }}>You offer</h2>
          {myItems.length === 0 ? (
            <p>Open packs to add shirts you can trade.</p>
          ) : (
            <ul className="list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {myItems.map((item) => {
                const sel = idInList(selectedMineIds, item._id);
                return (
                  <li key={item._id}>
                    <button
                      type="button"
                      className="list-item"
                      onClick={() =>
                        setSelectedMineIds((prev) => toggleId(prev, item._id))
                      }
                      style={{
                        width: "100%",
                        textAlign: "left",
                        cursor: "pointer",
                        border: sel ? "2px solid var(--primary)" : undefined,
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
                        <div style={{ fontSize: "0.8rem", opacity: 0.75 }}>
                          {tagLine(item)}
                        </div>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 style={{ marginBottom: "0.75rem", fontSize: "1.1rem" }}>You want</h2>
          {!peerPayload && <p>Search a username to see their shirts.</p>}
          {peerPayload && peerPayload.items.length === 0 && (
            <p>That user has no shirts in their collection yet. You can still offer a gift from your side only.</p>
          )}
          {peerPayload && peerPayload.items.length > 0 && (
            <ul className="list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {peerPayload.items.map((item) => {
                const sel = idInList(selectedTheirsIds, item._id);
                return (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTheirsIds((prev) => toggleId(prev, item._id))
                      }
                      style={{
                        width: "100%",
                        textAlign: "left",
                        cursor: "pointer",
                        border: sel ? "2px solid var(--primary)" : undefined,
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
                        <div style={{ fontSize: "0.8rem", opacity: 0.75 }}>
                          {tagLine(item)}
                        </div>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        </div>
      </div>
    </div>
  );
}
