/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import ShirtImage from "../components/ShirtImage";

const FAVORITES_FILTER = "__favorites__";
const SINGLE_STITCH_FILTER = "__single_stitch__";

export default function CollectionPage() {
  const [collection, setCollection] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchCollection = async () => {
    try {
      const res = await api.get("/collection");
      setCollection(res.data);
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetching collection:", error);

      if (error.response?.status === 401) {
        setErrorMessage("You need to log in to view your collection.");
      } else {
        setErrorMessage("Could not load collection.");
      }
    }
  };

  useEffect(() => {
    fetchCollection();
  }, []);

  const categoryNames = useMemo(() => {
    const names = new Set();
    collection.forEach((item) => {
      item.shirt?.categories?.forEach((c) => {
        if (c?.name) names.add(c.name);
      });
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [collection]);

  const sortedFiltered = useMemo(() => {
    let rows = collection;
    if (categoryFilter === FAVORITES_FILTER) {
      rows = rows.filter((item) => item.isFavorite);
    } else if (categoryFilter === SINGLE_STITCH_FILTER) {
      rows = rows.filter((item) => item.singleStitch);
    } else if (categoryFilter !== "all") {
      rows = rows.filter((item) =>
        item.shirt?.categories?.some((c) => c.name === categoryFilter)
      );
    }
    return [...rows].sort((a, b) => {
      const key = (item) =>
        (item.shirt?.categories?.map((c) => c.name).filter(Boolean) || [])
          .sort()
          .join(", ") || "—";
      const byCat = key(a).localeCompare(key(b));
      if (byCat !== 0) return byCat;
      return (a.shirt?.name || "").localeCompare(b.shirt?.name || "");
    });
  }, [collection, categoryFilter]);

  const displayRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedFiltered;
    return sortedFiltered.filter((item) => {
      const shirt = item.shirt || {};
      const parts = [
        shirt.name,
        shirt.brand,
        shirt.description,
        item.tag,
        ...(shirt.categories?.map((c) => c.name) || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const ss = item.singleStitch ? "single stitch" : "";
      return parts.includes(q) || ss.includes(q);
    });
  }, [sortedFiltered, searchQuery]);

  const toggleFavorite = async (id) => {
    try {
      await api.put(`/collection/favorite/${id}`);
      fetchCollection();
    } catch (error) {
      console.error("Error updating favorite:", error);
    }
  };

  const deleteCollectionItem = async (id) => {
    try {
      await api.delete(`/collection/${id}`);
      fetchCollection();
    } catch (error) {
      console.error("Error deleting collection item:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Collection</h1>

      {errorMessage && <p>{errorMessage}</p>}

      {!errorMessage && collection.length > 0 && (
        <div
          style={{
            marginBottom: "1rem",
            maxWidth: "480px",
            display: "grid",
            gap: "0.85rem",
          }}
        >
          <div>
            <label htmlFor="collection-category" style={{ display: "block", marginBottom: "0.35rem" }}>
              <strong>Show</strong>
            </label>
            <select
              id="collection-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.65rem", fontSize: "1rem" }}
            >
              <option value="all">All categories</option>
              <option value={FAVORITES_FILTER}>Favorites</option>
              <option value={SINGLE_STITCH_FILTER}>Single stitch</option>
              {categoryNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="collection-search" style={{ display: "block", marginBottom: "0.35rem" }}>
              <strong>Search</strong>
            </label>
            <input
              id="collection-search"
              type="search"
              placeholder="Name, brand, tag, category…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.65rem", fontSize: "1rem" }}
              autoComplete="off"
            />
          </div>
          <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.85 }}>
            Showing {displayRows.length} of {sortedFiltered.length} after filters
            {searchQuery.trim() ? " (search)" : ""}
            {" · "}
            {collection.length} total in collection.
          </p>
        </div>
      )}

      {!errorMessage && collection.length === 0 && (
        <p>You have not pulled any shirts yet.</p>
      )}

      {!errorMessage &&
        collection.length > 0 &&
        sortedFiltered.length > 0 &&
        displayRows.length === 0 && (
        <p>No items match your search. Clear the search box or try other words.</p>
      )}

      {!errorMessage && collection.length > 0 && sortedFiltered.length === 0 && (
        <p>
          {categoryFilter === FAVORITES_FILTER
            ? "No favorites yet. Star items with Add to Favorites."
            : categoryFilter === SINGLE_STITCH_FILTER
              ? "No single stitch shirts yet. They can drop from packs (Screen Stars & Giant blanks) or be added by an admin."
              : 'No items in this category. Choose "All categories" or another option.'}
        </p>
      )}

      {displayRows.length > 0 && (
        <div className="collection-items-panel">
          {displayRows.map((item) => {
            const categoryLabel =
              item.shirt?.categories?.map((c) => c.name).filter(Boolean).join(", ") || "—";

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
                  <h3>{item.shirt?.name || "Unknown Shirt"}</h3>
                  {item.singleStitch && (
                    <p className="collection-card__single-stitch-badge">Single stitch</p>
                  )}
                  <p><strong>Categories:</strong> {categoryLabel}</p>
                  <p><strong>Tag:</strong> {item.tag || "Gildan"}</p>
                  <p><strong>Description:</strong> {item.shirt?.description || "No description"}</p>
                  {item.isFavorite && (
                    <p className="collection-card__favorite-badge">Favorite</p>
                  )}

                  <button type="button" onClick={() => toggleFavorite(item._id)}>
                    {item.isFavorite ? "Remove Favorite" : "Add to Favorites"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteCollectionItem(item._id)}
                    style={{ marginLeft: "10px" }}
                  >
                    Remove From Collection
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
