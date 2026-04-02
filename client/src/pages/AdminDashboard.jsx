/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../api/api";
import ShirtImage from "../components/ShirtImage";

export default function AdminDashboard() {
  const [shirts, setShirts] = useState([]);
  const [collectionEntries, setCollectionEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rarities, setRarities] = useState([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    name: "",
    brand: "",
    description: "",
    image: "",
    rarity: "",
    categories: [],
    valueScore: 0,
  };

  const [form, setForm] = useState(emptyForm);

  const loadAdminData = async () => {
    try {
      const [shirtsRes, categoriesRes, raritiesRes, entriesRes] = await Promise.all([
        api.get("/admin/shirts"),
        api.get("/admin/categories"),
        api.get("/admin/rarities"),
        api.get("/admin/collection-entries"),
      ]);

      setShirts(shirtsRes.data);
      setCategories(categoriesRes.data);
      setRarities(raritiesRes.data);
      setCollectionEntries(entriesRes.data);
      setMessage("");
    } catch (error) {
      console.error("Admin fetch error:", error);
      if (error.response?.status === 403) {
        setMessage("Admin access only.");
      } else if (error.response?.status === 401) {
        setMessage("You must be logged in as admin.");
      } else {
        setMessage("Could not load admin data.");
      }
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCategoryChange = (categoryId) => {
    setForm((prev) => {
      const exists = prev.categories.includes(categoryId);

      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((id) => id !== categoryId)
          : [...prev.categories, categoryId],
      };
    });
  };

  const handleCreateOrUpdateShirt = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        valueScore: Number(form.valueScore),
      };

      if (editingId) {
        await api.put(`/admin/shirts/${editingId}`, payload);
        setMessage("Shirt updated successfully.");
      } else {
        await api.post("/admin/shirts", payload);
        setMessage("Shirt created successfully.");
      }

      setForm(emptyForm);
      setEditingId(null);
      loadAdminData();
    } catch (error) {
      console.error("Create/update shirt error:", error);
      setMessage(error.response?.data?.message || "Could not save shirt.");
    }
  };

  const handleEditShirt = (shirt) => {
    setEditingId(shirt._id);
    setForm({
      name: shirt.name || "",
      brand: shirt.brand || "",
      description: shirt.description || "",
      image: shirt.image || "",
      rarity: shirt.rarity?._id || "",
      categories: shirt.categories?.map((c) => c._id) || [],
      valueScore: shirt.valueScore ?? 0,
    });
    setMessage(`Editing ${shirt.name}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteShirt = async (id) => {
    try {
      await api.delete(`/admin/shirts/${id}`);
      setMessage("Shirt deleted.");
      loadAdminData();
    } catch (error) {
      console.error("Delete shirt error:", error);
      setMessage(error.response?.data?.message || "Could not delete shirt.");
    }
  };

  const handleRemoveCollectionEntry = async (entryId) => {
    if (
      !window.confirm(
        "Remove this shirt from that user's collection? This cannot be undone."
      )
    ) {
      return;
    }
    try {
      await api.delete(`/admin/collection-entries/${entryId}`);
      setMessage("Collection entry removed.");
      loadAdminData();
    } catch (error) {
      console.error("Remove collection entry error:", error);
      setMessage(
        error.response?.data?.message || "Could not remove collection entry."
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("Edit canceled.");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Admin Dashboard</h1>

      {message && <p>{message}</p>}

      <div
        style={{
          border: "1px solid #ccc",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <h2>{editingId ? "Edit Shirt" : "Create New Shirt"}</h2>

        <form onSubmit={handleCreateOrUpdateShirt}>
          <div style={{ marginBottom: "10px" }}>
            <label>Shirt Name</label>
            <br />
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Brand</label>
            <br />
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Description</label>
            <br />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows="3"
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>
              Image URL <span style={{ fontWeight: 400 }}>(Imgur direct link, e.g. https://i.imgur.com/… .jpg)</span>
            </label>
            <br />
            <input
              type="text"
              placeholder="https://i.imgur.com/… .jpg or .png"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
            {form.image?.trim() && (
              <div style={{ marginTop: "8px" }}>
                <ShirtImage src={form.image} alt="Preview" />
              </div>
            )}
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Rarity</label>
            <br />
            <select
              value={form.rarity}
              onChange={(e) => setForm({ ...form, rarity: e.target.value })}
              required
            >
              <option value="">Select rarity</option>
              {rarities.map((rarity) => (
                <option key={rarity._id} value={rarity._id}>
                  {rarity.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Value Score</label>
            <br />
            <input
              type="number"
              value={form.valueScore}
              onChange={(e) => setForm({ ...form, valueScore: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Categories</label>
            {categories.map((category) => (
              <div key={category._id}>
                <label>
                  <input
                    type="checkbox"
                    checked={form.categories.includes(category._id)}
                    onChange={() => handleCategoryChange(category._id)}
                  />
                  {" "}{category.name}
                </label>
              </div>
            ))}
          </div>

          <button type="submit">
            {editingId ? "Update Shirt" : "Create Shirt"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{ marginLeft: "10px" }}
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div>
        <h2>All Shirts</h2>

        {shirts.length === 0 && <p>No shirts found.</p>}

        {shirts.map((shirt) => (
          <div
            key={shirt._id}
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              marginBottom: "12px",
            }}
          >
            <div className="collection-item-row">
              <ShirtImage src={shirt.image} alt={shirt.name} />
              <div>
            <h3>{shirt.name}</h3>
            <p><strong>Brand:</strong> {shirt.brand}</p>
            <p><strong>Rarity:</strong> {shirt.rarity?.name || "Unknown"}</p>
            <p>
              <strong>Categories:</strong>{" "}
              {shirt.categories?.length
                ? shirt.categories.map((c) => c.name).join(", ")
                : "None"}
            </p>
            <p><strong>Value Score:</strong> {shirt.valueScore}</p>
            <p><strong>Description:</strong> {shirt.description}</p>

            <button onClick={() => handleEditShirt(shirt)}>
              Edit Shirt
            </button>

            <button
              onClick={() => handleDeleteShirt(shirt._id)}
              style={{ marginLeft: "10px" }}
            >
              Delete Shirt
            </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "32px" }}>
        <h2>User collections (pulls)</h2>
        <p style={{ marginBottom: "12px", maxWidth: "640px" }}>
          Remove individual pulls from any account—for example duplicates or items
          that should not stay in someone&apos;s collection. This does not delete
          the shirt from the catalog; use &quot;Delete Shirt&quot; above for that.
        </p>

        {collectionEntries.length === 0 && <p>No collection entries yet.</p>}

        {collectionEntries.map((entry) => (
          <div
            key={entry._id}
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              marginBottom: "12px",
            }}
          >
            <div className="collection-item-row">
              <ShirtImage
                src={entry.shirt?.image}
                alt={entry.shirt?.name || "Shirt"}
                size="sm"
              />
              <div>
                <p>
                  <strong>User:</strong> {entry.user?.username || "Unknown"}
                </p>
                <p>
                  <strong>Shirt:</strong> {entry.shirt?.name || "Unknown"}
                </p>
                <p>
                  <strong>Pack:</strong> {entry.pack?.name || "—"}
                </p>
                <p style={{ fontSize: "0.85rem", opacity: 0.85 }}>
                  Entry ID: {entry._id}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemoveCollectionEntry(entry._id)}
                >
                  Remove from user collection
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}