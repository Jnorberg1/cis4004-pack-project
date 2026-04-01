import { useEffect, useState } from "react";
import api from "../api/api";

export default function CollectionPage() {
  const [collection, setCollection] = useState([]);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await api.get("/collection");
        setCollection(res.data);
      } catch (error) {
        console.error("Error fetching collection:", error);
      }
    };

    fetchCollection();
  }, []);

  const toggleFavorite = async (id) => {
    try {
      await api.put(`/collection/favorite/${id}`);
      const res = await api.get("/collection");
      setCollection(res.data);
    } catch (error) {
      console.error("Error updating favorite:", error);
    }
  };

  return (
    <section className="page">
      <h1>My Collection</h1>
      <div className="list">
        {collection.map((item) => (
          <div key={item._id} className="card collection-item">
            <strong>{item.shirt?.name}</strong>
            <span>{item.isFavorite ? "Favorite" : "Not Favorite"}</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => toggleFavorite(item._id)}
            >
              Toggle Favorite
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}