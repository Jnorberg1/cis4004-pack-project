import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import ShirtImage from "../components/ShirtImage";

function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function LeaderboardUserPage() {
  const { username: usernameParam } = useParams();
  const navigate = useNavigate();
  const decoded = usernameParam ? decodeURIComponent(usernameParam) : "";

  const [payload, setPayload] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const viewer = readStoredUser();
  const isSelf = viewer?.username === decoded;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!decoded) {
        setLoading(false);
        setErrorMessage("Invalid username.");
        return;
      }

      if (!viewer?.id) {
        setLoading(false);
        setPayload(null);
        setErrorMessage("Log in to view this collector’s shirts.");
        return;
      }

      setLoading(true);
      setErrorMessage("");

      const self = viewer.username === decoded;

      try {
        if (self) {
          const res = await api.get("/collection");
          if (cancelled) return;
          setPayload({
            user: { username: viewer.username },
            items: res.data,
          });
        } else {
          const res = await api.get(
            `/collection/user/${encodeURIComponent(decoded)}`
          );
          if (cancelled) return;
          setPayload(res.data);
        }
      } catch (error) {
        if (cancelled) return;
        setPayload(null);
        setErrorMessage(
          error.response?.data?.message || "Could not load this collection."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [decoded, viewer?.id, viewer?.username]);

  const goTrade = () => {
    if (!decoded || isSelf) return;
    navigate(`/trading?with=${encodeURIComponent(decoded)}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <p style={{ marginBottom: "1rem" }}>
        <Link to="/leaderboard">← Back to leaderboard</Link>
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <h1 style={{ margin: 0 }}>{decoded || "User"}</h1>
        {viewer?.id && !isSelf && (
          <button type="button" className="btn-primary" onClick={goTrade}>
            Trade
          </button>
        )}
        {isSelf && (
          <span style={{ opacity: 0.85, fontSize: "0.95rem" }}>
            This is you — manage shirts in{" "}
            <Link to="/collection">My Collection</Link>.
          </span>
        )}
      </div>

      {loading && <p>Loading…</p>}

      {errorMessage && <p style={{ color: "#ff8a8a" }}>{errorMessage}</p>}

      {!loading && !errorMessage && payload && (
        <>
          <p style={{ marginBottom: "1rem", opacity: 0.9 }}>
            <strong>{payload.items?.length ?? 0}</strong>{" "}
            {(payload.items?.length ?? 0) === 1 ? "shirt" : "shirts"}
          </p>

          {(payload.items?.length ?? 0) === 0 && (
            <p>No shirts in this collection yet.</p>
          )}

          {(payload.items || []).map((item) => {
            const categoryLabel =
              item.shirt?.categories?.map((c) => c.name).filter(Boolean).join(", ") ||
              "—";

            return (
              <div
                key={item._id}
                className={`collection-card${item.singleStitch ? " collection-card--single-stitch" : ""}`}
              >
                <div className="collection-item-row">
                  <ShirtImage
                    src={item.shirt?.image}
                    alt={item.shirt?.name || "Shirt"}
                  />
                  <div>
                    <h3 style={{ marginTop: 0 }}>
                      {item.shirt?.name || "Unknown Shirt"}
                    </h3>
                    {item.singleStitch && (
                      <p className="collection-card__single-stitch-badge">Single stitch</p>
                    )}
                    {item.isFavorite && (
                      <p className="collection-card__favorite-badge">Favorite</p>
                    )}
                    <p>
                      <strong>Categories:</strong> {categoryLabel}
                    </p>
                    <p>
                      <strong>Tag:</strong> {item.tag || "Gildan"}
                    </p>
                    <p>
                      <strong>Description:</strong>{" "}
                      {item.shirt?.description || "No description"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
