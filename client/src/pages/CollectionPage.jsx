/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../api/api";

export default function CollectionPage() {
  const [collection, setCollection] = useState([]);
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

      {!errorMessage && collection.length === 0 && (
        <p>You have not pulled any shirts yet.</p>
      )}

      {collection.map((item) => (
        <div
          key={item._id}
          style={{
            border: "1px solid #ccc",
            padding: "12px",
            marginBottom: "12px",
          }}
        >
          <h3>{item.shirt?.name || "Unknown Shirt"}</h3>
          <p><strong>Brand:</strong> {item.shirt?.brand || "Unknown"}</p>
          <p><strong>Rarity:</strong> {item.shirt?.rarity?.name || "Unknown"}</p>
          <p><strong>Value Score:</strong> {item.shirt?.valueScore ?? "N/A"}</p>
          <p><strong>Description:</strong> {item.shirt?.description || "No description"}</p>
          <p><strong>Favorite:</strong> {item.isFavorite ? "Yes" : "No"}</p>
          <p><strong>Pulled From:</strong> {item.pack?.name || "Unknown Pack"}</p>

          <button onClick={() => toggleFavorite(item._id)}>
            {item.isFavorite ? "Remove Favorite" : "Add to Favorites"}
          </button>

          <button
            onClick={() => deleteCollectionItem(item._id)}
            style={{ marginLeft: "10px" }}
          >
            Remove From Collection
          </button>
        </div>
      ))}
    </div>
  );
}