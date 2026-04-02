/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import ShirtImage from "../components/ShirtImage";
import { useSessionUiState } from "../utils/sessionUiState";

function entryPullSearchBlob(entry) {
  const shirt = entry.shirt;
  const pack = entry.pack;
  return [
    shirt?.name,
    shirt?.brand,
    entry.tag,
    pack?.name,
    entry.singleStitch ? "single stitch" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** When a search query is set, matching pulls sort to the top for each user. */
function sortEntriesWithSearchMatchesFirst(entries, rawQuery) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [...entries];
  return [...entries].sort((a, b) => {
    const ma = entryPullSearchBlob(a).includes(q);
    const mb = entryPullSearchBlob(b).includes(q);
    if (ma === mb) return 0;
    return ma ? -1 : 1;
  });
}

export default function AdminDashboard() {
  const [shirts, setShirts] = useState([]);
  const [collectionEntries, setCollectionEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rarities, setRarities] = useState([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [allShirtsMinimized, setAllShirtsMinimized] = useSessionUiState(
    "admin.allShirtsMinimized",
    false
  );
  const [userCollectionsMinimized, setUserCollectionsMinimized] =
    useSessionUiState("admin.userCollectionsMinimized", false);
  const [createShirtMinimized, setCreateShirtMinimized] = useSessionUiState(
    "admin.createShirtMinimized",
    false
  );
  const [categoriesExpanded, setCategoriesExpanded] = useSessionUiState(
    "admin.categoriesExpanded",
    false
  );
  const [expandedCollectionUserIds, setExpandedCollectionUserIds] =
    useSessionUiState("admin.expandedCollectionUserIds", []);
  const [blankTags, setBlankTags] = useState([]);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantShirtId, setGrantShirtId] = useState("");
  const [grantTag, setGrantTag] = useState("Gildan");
  const [grantSingleStitch, setGrantSingleStitch] = useState(false);
  const [allShirtsSearch, setAllShirtsSearch] = useState("");
  const [userCollectionsSearch, setUserCollectionsSearch] = useState("");
  const [grantShirtSectionMinimized, setGrantShirtSectionMinimized] =
    useSessionUiState("admin.grantShirtSectionMinimized", false);
  const [adminPacks, setAdminPacks] = useState([]);
  const [packSectionMinimized, setPackSectionMinimized] = useSessionUiState(
    "admin.packSectionMinimized",
    false
  );
  const [editingPackId, setEditingPackId] = useState(null);
  const emptyPackForm = { name: "", description: "", cardsPerPack: 3 };
  const [packForm, setPackForm] = useState(emptyPackForm);
  const [grantPackSectionMinimized, setGrantPackSectionMinimized] =
    useSessionUiState("admin.grantPackSectionMinimized", false);
  const [grantPackUserId, setGrantPackUserId] = useState("");
  const [grantPackPackId, setGrantPackPackId] = useState("");
  const [grantPackCount, setGrantPackCount] = useState(1);

  const emptyForm = {
    name: "",
    brand: "",
    description: "",
    image: "",
    rarity: "",
    categories: [],
    pack: "",
  };

  const [form, setForm] = useState(emptyForm);

  const loadAdminData = async ({ clearMessage = true } = {}) => {
    try {
      const [
        shirtsRes,
        packsRes,
        categoriesRes,
        raritiesRes,
        entriesRes,
        usersRes,
        tagsRes,
      ] = await Promise.all([
        api.get("/admin/shirts"),
        api.get("/admin/packs"),
        api.get("/admin/categories"),
        api.get("/admin/rarities"),
        api.get("/admin/collection-entries"),
        api.get("/admin/users"),
        api.get("/admin/blank-tags"),
      ]);

      setShirts(shirtsRes.data);
      setAdminPacks(packsRes.data);
      setCategories(categoriesRes.data);
      setRarities(raritiesRes.data);
      setCollectionEntries(entriesRes.data);
      setUsers(usersRes.data);
      setBlankTags(tagsRes.data.tags || []);
      if (clearMessage) setMessage("");
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

  useEffect(() => {
    if (editingId) setCreateShirtMinimized(false);
  }, [editingId]);

  useEffect(() => {
    if (editingPackId) setPackSectionMinimized(false);
  }, [editingPackId]);

  const handleCreateOrUpdatePack = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: packForm.name.trim(),
        description: packForm.description,
        cardsPerPack: Number(packForm.cardsPerPack) || 3,
      };
      if (editingPackId) {
        await api.put(`/admin/packs/${editingPackId}`, payload);
        setMessage("Pack updated.");
      } else {
        await api.post("/admin/packs", payload);
        setMessage("Pack created.");
      }
      setPackForm(emptyPackForm);
      setEditingPackId(null);
      loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save pack.");
    }
  };

  const handleEditPack = (pack) => {
    setEditingPackId(pack._id);
    setPackForm({
      name: pack.name || "",
      description: pack.description || "",
      cardsPerPack: pack.cardsPerPack ?? 3,
    });
    setMessage(`Editing pack: ${pack.name}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeletePack = async (id) => {
    if (!window.confirm("Delete this pack? Only allowed if no shirts use it.")) {
      return;
    }
    try {
      await api.delete(`/admin/packs/${id}`);
      setMessage("Pack deleted.");
      if (editingPackId === id) {
        setEditingPackId(null);
        setPackForm(emptyPackForm);
      }
      loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not delete pack.");
    }
  };

  const handleCancelPackEdit = () => {
    setEditingPackId(null);
    setPackForm(emptyPackForm);
    setMessage("Pack edit canceled.");
  };

  const handleGrantPacksToUser = async (e) => {
    e.preventDefault();
    if (!grantPackUserId || !grantPackPackId) {
      setMessage("Select a user and a pack.");
      return;
    }
    const count = Math.min(50, Math.max(1, parseInt(grantPackCount, 10) || 1));
    try {
      const res = await api.post(`/admin/users/${grantPackUserId}/grant-packs`, {
        packId: grantPackPackId,
        count,
      });
      setMessage(res.data?.message || "Bonus packs granted.");
      setGrantPackCount(1);
      loadAdminData({ clearMessage: false });
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not grant packs.");
    }
  };

  const categoriesBarSummary = useMemo(() => {
    const names = form.categories
      .map((id) => categories.find((c) => c._id === id)?.name)
      .filter(Boolean);
    if (names.length === 0) return "None selected · click to choose";
    const preview = names.slice(0, 2).join(", ");
    const more =
      names.length > 2 ? ` (+${names.length - 2} more)` : "";
    return `${names.length} selected: ${preview}${more}`;
  }, [form.categories, categories]);

  const shirtsSorted = useMemo(
    () =>
      [...shirts].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        })
      ),
    [shirts]
  );

  const allShirtsFiltered = useMemo(() => {
    const q = allShirtsSearch.trim().toLowerCase();
    if (!q) return shirtsSorted;
    return shirtsSorted.filter((shirt) => {
      const blob = [
        shirt.name,
        shirt.brand,
        shirt.description,
        shirt.rarity?.name,
        ...(shirt.categories?.map((c) => c.name) || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [shirtsSorted, allShirtsSearch]);

  const entriesByUserId = useMemo(() => {
    const map = {};
    for (const entry of collectionEntries) {
      const uid =
        entry.user?._id != null ? String(entry.user._id) : null;
      if (!uid) continue;
      if (!map[uid]) map[uid] = [];
      map[uid].push(entry);
    }
    return map;
  }, [collectionEntries]);

  const usersFiltered = useMemo(() => {
    const q = userCollectionsSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const uid = String(user._id);
      if ((user.username || "").toLowerCase().includes(q)) return true;
      const entries = entriesByUserId[uid] || [];
      return entries.some((entry) => {
        const shirt = entry.shirt;
        const pack = entry.pack;
        const blob = [
          shirt?.name,
          shirt?.brand,
          entry.tag,
          pack?.name,
          entry.singleStitch ? "single stitch" : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    });
  }, [users, entriesByUserId, userCollectionsSearch]);

  const toggleCollectionUserExpanded = (userId) => {
    const sid = String(userId);
    setExpandedCollectionUserIds((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      if (arr.includes(sid)) return arr.filter((x) => x !== sid);
      return [...arr, sid];
    });
  };

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
      const payload = { ...form };

      if (editingId) {
        await api.put(`/admin/shirts/${editingId}`, payload);
        setMessage("Shirt updated successfully.");
      } else {
        await api.post("/admin/shirts", payload);
        setMessage("Shirt created successfully.");
      }

      setForm({ ...emptyForm });
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
      pack: shirt.pack?._id || shirt.pack || "",
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

  const handleGrantShirtToUser = async (e) => {
    e.preventDefault();
    if (!grantUserId || !grantShirtId) {
      setMessage("Select a user and a shirt to grant.");
      return;
    }
    try {
      await api.post("/admin/collection-entries", {
        user: grantUserId,
        shirt: grantShirtId,
        tag: grantTag,
        singleStitch: grantSingleStitch,
      });
      setMessage("Shirt added to that user's collection.");
      setGrantShirtId("");
      setGrantSingleStitch(false);
      await loadAdminData({ clearMessage: false });
      if (grantUserId) {
        const sid = String(grantUserId);
        setExpandedCollectionUserIds((prev) => {
          const arr = Array.isArray(prev) ? prev : [];
          if (arr.includes(sid)) return arr;
          return [...arr, sid];
        });
      }
    } catch (error) {
      console.error("Grant shirt error:", error);
      setMessage(
        error.response?.data?.message || "Could not grant shirt to user."
      );
    }
  };

  const handleRemoveCollectionEntry = async (entryId) => {
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
          border: "1px solid #343434",
          padding: "16px",
          marginBottom: "24px",
          borderRadius: "0.65rem",
          background: "#141414",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: createShirtMinimized ? "0" : "16px",
          }}
        >
          <h2 style={{ margin: 0, color: "#ffffff" }}>
            {editingId ? "Edit Shirt" : "Create New Shirt"}
          </h2>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setCreateShirtMinimized((v) => !v)}
            aria-expanded={!createShirtMinimized}
          >
            {createShirtMinimized ? "Expand" : "Minimize"}
          </button>
        </div>

        {!createShirtMinimized && (
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
                Image URL{" "}
                <span style={{ fontWeight: 400 }}>
                  (Imgur direct link, e.g. https://i.imgur.com/… .jpg)
                </span>
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
              <label>Pack (each shirt belongs to exactly one pack)</label>
              <br />
              <select
                value={form.pack}
                onChange={(e) => setForm({ ...form, pack: e.target.value })}
                required
              >
                <option value="">Select pack</option>
                {adminPacks.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <button
                type="button"
                onClick={() => setCategoriesExpanded((v) => !v)}
                aria-expanded={categoriesExpanded}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  border: "1px solid #343434",
                  borderRadius: "0.65rem",
                  background: categoriesExpanded ? "#252526" : "#1a1a1b",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  font: "inherit",
                  marginBottom: categoriesExpanded ? "10px" : "0",
                }}
              >
                <strong>Categories</strong>
                <span style={{ opacity: 0.9, fontSize: "0.9rem", fontWeight: 400 }}>
                  {categoriesBarSummary}
                </span>
              </button>
              {categoriesExpanded && (
                <div
                  style={{
                    border: "1px solid #343434",
                    borderRadius: "0.65rem",
                    padding: "12px 12px 12px 14px",
                    background: "#0f0f10",
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  {categories.map((category) => (
                    <label
                      key={category._id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.25rem 1fr",
                        gap: "12px",
                        alignItems: "center",
                        cursor: "pointer",
                        color: "#ffffff",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.categories.includes(category._id)}
                        onChange={() => handleCategoryChange(category._id)}
                        style={{
                          margin: 0,
                          width: "1.125rem",
                          height: "1.125rem",
                          flexShrink: 0,
                          accentColor: "var(--primary, #fcc904)",
                        }}
                      />
                      <span style={{ lineHeight: 1.35 }}>{category.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary">
              {editingId ? "Update Shirt" : "Create Shirt"}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
                style={{ marginLeft: "10px" }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        )}
      </div>

      <div
        style={{
          border: "1px solid #343434",
          padding: "16px",
          marginBottom: "24px",
          borderRadius: "0.65rem",
          background: "#141414",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: packSectionMinimized ? "0" : "16px",
          }}
        >
          <h2 style={{ margin: 0, color: "#ffffff" }}>
            {editingPackId ? "Edit pack" : "Create & manage packs"}
          </h2>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setPackSectionMinimized((v) => !v)}
            aria-expanded={!packSectionMinimized}
          >
            {packSectionMinimized ? "Expand" : "Minimize"}
          </button>
        </div>

        {!packSectionMinimized && (
          <>
            <form onSubmit={handleCreateOrUpdatePack} style={{ marginBottom: "20px" }}>
              <div style={{ marginBottom: "10px" }}>
                <label>Name</label>
                <br />
                <input
                  type="text"
                  value={packForm.name}
                  onChange={(e) =>
                    setPackForm({ ...packForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Description</label>
                <br />
                <textarea
                  value={packForm.description}
                  onChange={(e) =>
                    setPackForm({ ...packForm, description: e.target.value })
                  }
                  rows="2"
                />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Cards per open</label>
                <br />
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={packForm.cardsPerPack}
                  onChange={(e) =>
                    setPackForm({
                      ...packForm,
                      cardsPerPack: e.target.value,
                    })
                  }
                />
              </div>
              <button type="submit" className="btn-primary">
                {editingPackId ? "Update pack" : "Create pack"}
              </button>
              {editingPackId && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginLeft: "10px" }}
                  onClick={handleCancelPackEdit}
                >
                  Cancel
                </button>
              )}
            </form>

            <h3 style={{ color: "#ffffff", marginTop: 0 }}>Existing packs</h3>
            {adminPacks.length === 0 && <p>No packs yet.</p>}
            {adminPacks.map((p) => (
              <div
                key={p._id}
                style={{
                  border: "1px solid #343434",
                  padding: "12px",
                  marginBottom: "10px",
                  borderRadius: "0.5rem",
                  background: "#0f0f10",
                }}
              >
                <strong>{p.name}</strong>
                <p style={{ margin: "0.35rem 0", opacity: 0.9 }}>
                  {p.shirtPool?.length ?? 0} shirts · {p.cardsPerPack ?? 3} cards
                  per open
                </p>
                <p style={{ margin: "0 0 8px", fontSize: "0.9rem" }}>
                  {p.description}
                </p>
                <button type="button" onClick={() => handleEditPack(p)}>
                  Edit
                </button>
                <button
                  type="button"
                  style={{ marginLeft: "10px" }}
                  onClick={() => handleDeletePack(p._id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <div
        style={{
          marginBottom: "24px",
          border: "2px solid #3a3a3c",
          borderRadius: "0.75rem",
          overflow: "hidden",
          background: "#161616",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            padding: "12px 16px",
            background: "#1e1e20",
            borderBottom: allShirtsMinimized ? "none" : "1px solid #343434",
          }}
        >
          <h2 style={{ margin: 0, color: "#ffffff" }}>All Shirts</h2>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setAllShirtsMinimized((v) => !v)}
            aria-expanded={!allShirtsMinimized}
          >
            {allShirtsMinimized ? "Expand" : "Minimize"}
          </button>
        </div>

        {!allShirtsMinimized && (
          <div style={{ padding: "16px", color: "#ffffff" }}>
            {shirts.length > 0 && (
              <div style={{ marginBottom: "14px", maxWidth: "420px" }}>
                <label htmlFor="admin-all-shirts-search" style={{ display: "block", marginBottom: "0.35rem" }}>
                  <strong>Search catalog</strong>
                </label>
                <input
                  id="admin-all-shirts-search"
                  type="search"
                  placeholder="Name, brand, rarity, category…"
                  value={allShirtsSearch}
                  onChange={(e) => setAllShirtsSearch(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem 0.65rem", fontSize: "1rem" }}
                  autoComplete="off"
                />
                <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", opacity: 0.85 }}>
                  Showing {allShirtsFiltered.length} of {shirts.length} shirts
                  {allShirtsSearch.trim() ? " (search)" : ""}.
                </p>
              </div>
            )}

            {shirts.length === 0 && <p>No shirts found.</p>}

            {allShirtsFiltered.length === 0 && shirts.length > 0 && (
              <p>No shirts match this search.</p>
            )}

            {allShirtsFiltered.map((shirt) => (
              <div
                key={shirt._id}
                style={{
                  border: "1px solid #343434",
                  padding: "12px",
                  marginBottom: "12px",
                  borderRadius: "0.5rem",
                  background: "#141414",
                }}
              >
                <div className="collection-item-row">
                  <ShirtImage src={shirt.image} alt={shirt.name} />
                  <div>
                    <h3>{shirt.name}</h3>
                    <p><strong>Brand:</strong> {shirt.brand}</p>
                    <p><strong>Rarity:</strong> {shirt.rarity?.name || "Unknown"}</p>
                    <p>
                      <strong>Pack:</strong>{" "}
                      {shirt.pack?.name || "—"}
                    </p>
                    <p>
                      <strong>Categories:</strong>{" "}
                      {shirt.categories?.length
                        ? shirt.categories.map((c) => c.name).join(", ")
                        : "None"}
                    </p>
                    <p><strong>Description:</strong> {shirt.description}</p>

                    <button type="button" onClick={() => handleEditShirt(shirt)}>
                      Edit Shirt
                    </button>

                    <button
                      type="button"
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
        )}
      </div>

      <div
        style={{
          marginTop: "24px",
          border: "2px solid #3a3a3c",
          borderRadius: "0.75rem",
          overflow: "hidden",
          background: "#161616",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            padding: "12px 16px",
            background: "#1e1e20",
            borderBottom: grantPackSectionMinimized ? "none" : "1px solid #343434",
          }}
        >
          <h2 style={{ margin: 0, color: "#ffffff" }}>Grant pack opens to user</h2>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setGrantPackSectionMinimized((v) => !v)}
            aria-expanded={!grantPackSectionMinimized}
          >
            {grantPackSectionMinimized ? "Expand" : "Minimize"}
          </button>
        </div>
        {!grantPackSectionMinimized && (
          <div style={{ padding: "16px", background: "#0f0f10", color: "#ffffff" }}>
            <p style={{ margin: "0 0 14px", fontSize: "0.9rem", opacity: 0.9 }}>
              Adds bonus pack opens. The user can open that pack type until the
              grants are used (in addition to two random daily drops).
            </p>
            <form
              onSubmit={handleGrantPacksToUser}
              style={{ display: "grid", gap: "12px", maxWidth: "420px" }}
            >
              <div>
                <label htmlFor="grant-pack-user">User</label>
                <br />
                <select
                  id="grant-pack-user"
                  value={grantPackUserId}
                  onChange={(e) => setGrantPackUserId(e.target.value)}
                  required
                  style={{ width: "100%", marginTop: "4px" }}
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="grant-pack-pack">Pack</label>
                <br />
                <select
                  id="grant-pack-pack"
                  value={grantPackPackId}
                  onChange={(e) => setGrantPackPackId(e.target.value)}
                  required
                  style={{ width: "100%", marginTop: "4px" }}
                >
                  <option value="">Select pack</option>
                  {adminPacks.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="grant-pack-count">Count (max 50)</label>
                <br />
                <input
                  id="grant-pack-count"
                  type="number"
                  min={1}
                  max={50}
                  value={grantPackCount}
                  onChange={(e) => setGrantPackCount(e.target.value)}
                  style={{ width: "100%", marginTop: "4px" }}
                />
              </div>
              <button type="submit" className="btn-primary">
                Grant pack opens
              </button>
            </form>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "32px",
          border: "2px solid #3a3a3c",
          borderRadius: "0.75rem",
          overflow: "hidden",
          background: "#161616",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            padding: "12px 16px",
            background: "#1e1e20",
            borderBottom: grantShirtSectionMinimized ? "none" : "1px solid #343434",
          }}
        >
          <h2 style={{ margin: 0, color: "#ffffff" }}>Grant shirt to user</h2>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setGrantShirtSectionMinimized((v) => !v)}
            aria-expanded={!grantShirtSectionMinimized}
          >
            {grantShirtSectionMinimized ? "Expand" : "Minimize"}
          </button>
        </div>
        {!grantShirtSectionMinimized && (
          <div style={{ padding: "16px", background: "#0f0f10", color: "#ffffff" }}>
            <p
              style={{
                margin: "0 0 14px",
                fontSize: "0.9rem",
                opacity: 0.9,
                maxWidth: "640px",
              }}
            >
              Adds a new collection entry (not from a pack). Choose tag and single
              stitch freely.
            </p>
            <form
              onSubmit={handleGrantShirtToUser}
              style={{ display: "grid", gap: "12px", maxWidth: "420px" }}
            >
              <div>
                <label htmlFor="grant-user" style={{ color: "#ffffff" }}>
                  User
                </label>
                <br />
                <select
                  id="grant-user"
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                  required
                  style={{ width: "100%", marginTop: "4px" }}
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username}
                      {u.role === "admin" ? " (admin)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="grant-shirt" style={{ color: "#ffffff" }}>
                  Shirt
                </label>
                <br />
                <select
                  id="grant-shirt"
                  value={grantShirtId}
                  onChange={(e) => setGrantShirtId(e.target.value)}
                  required
                  style={{ width: "100%", marginTop: "4px" }}
                >
                  <option value="">Select shirt</option>
                  {shirtsSorted.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                      {s.rarity?.name ? ` — ${s.rarity.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="grant-tag" style={{ color: "#ffffff" }}>
                  Tag
                </label>
                <br />
                <select
                  id="grant-tag"
                  value={grantTag}
                  onChange={(e) => setGrantTag(e.target.value)}
                  style={{ width: "100%", marginTop: "4px" }}
                >
                  {(blankTags.length ? blankTags : ["Gildan"]).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  border: "1px solid #343434",
                  borderRadius: "0.65rem",
                  padding: "10px 12px",
                  background: "#141414",
                }}
              >
                <label
                  htmlFor="grant-single-stitch"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.25rem 1fr",
                    gap: "12px",
                    alignItems: "center",
                    cursor: "pointer",
                    color: "#ffffff",
                    margin: 0,
                  }}
                >
                  <input
                    id="grant-single-stitch"
                    type="checkbox"
                    checked={grantSingleStitch}
                    onChange={(e) => setGrantSingleStitch(e.target.checked)}
                    style={{
                      margin: 0,
                      width: "1.125rem",
                      height: "1.125rem",
                      accentColor: "var(--primary, #fcc904)",
                    }}
                  />
                  <span style={{ lineHeight: 1.35 }}>
                    <strong>Single stitch</strong>
                  </span>
                </label>
              </div>
              <div>
                <button type="submit" className="btn-primary">
                  Grant shirt
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "24px",
          color: "#ffffff",
          border: "2px solid #3a3a3c",
          borderRadius: "0.75rem",
          overflow: "hidden",
          background: "#161616",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            padding: "12px 16px",
            background: "#1e1e20",
            borderBottom: userCollectionsMinimized ? "none" : "1px solid #343434",
          }}
        >
          <h2 style={{ margin: 0, color: "#ffffff" }}>User collections (pulls)</h2>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setUserCollectionsMinimized((v) => !v)}
            aria-expanded={!userCollectionsMinimized}
          >
            {userCollectionsMinimized ? "Expand" : "Minimize"}
          </button>
        </div>

        {!userCollectionsMinimized && (
          <div style={{ padding: "16px", background: "#0f0f10" }}>
            <p style={{ margin: "0 0 16px", maxWidth: "640px", color: "#ffffff" }}>
              Remove individual pulls from any account—for example duplicates or items
              that should not stay in someone&apos;s collection. This does not delete
              the shirt from the catalog; use &quot;Delete Shirt&quot; above for that.
            </p>

            <div style={{ marginBottom: "18px", maxWidth: "420px" }}>
              <label htmlFor="admin-users-pulls-search" style={{ display: "block", marginBottom: "0.35rem" }}>
                <strong>Search users &amp; pulls</strong>
              </label>
              <input
                id="admin-users-pulls-search"
                type="search"
                placeholder="Username, shirt, tag, pack…"
                value={userCollectionsSearch}
                onChange={(e) => setUserCollectionsSearch(e.target.value)}
                style={{ width: "100%", padding: "0.5rem 0.65rem", fontSize: "1rem" }}
                autoComplete="off"
              />
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", opacity: 0.85, color: "#ffffff" }}>
                Showing {usersFiltered.length} of {users.length} users
                {userCollectionsSearch.trim() ? " (search)" : ""}. Open a user to see
                pulls that match the search listed first.
              </p>
            </div>

            {users.length === 0 && (
              <p style={{ color: "#ffffff" }}>No users registered.</p>
            )}

            {usersFiltered.length === 0 && users.length > 0 && (
              <p style={{ color: "#ffffff" }}>No users match this search.</p>
            )}

            {usersFiltered.map((user) => {
              const uid = String(user._id);
              const entriesRaw = entriesByUserId[uid] || [];
              const entries = sortEntriesWithSearchMatchesFirst(
                entriesRaw,
                userCollectionsSearch
              );
              const expanded =
                Array.isArray(expandedCollectionUserIds) &&
                expandedCollectionUserIds.includes(uid);
              return (
                <div
                  key={uid}
                  style={{
                    border: "1px solid #343434",
                    marginBottom: "12px",
                    overflow: "hidden",
                    borderRadius: "0.65rem",
                    background: "#141414",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleCollectionUserExpanded(uid)}
                    aria-expanded={expanded}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 14px",
                      border: "none",
                      background: expanded ? "#252526" : "#1a1a1b",
                      color: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                      font: "inherit",
                    }}
                  >
                    <span>
                      <strong>{user.username}</strong>
                      {user.role === "admin" && (
                        <span style={{ marginLeft: "8px", opacity: 0.75 }}>
                          (admin)
                        </span>
                      )}
                    </span>
                    <span style={{ opacity: 0.85 }}>
                      {entries.length} pull
                      {entries.length !== 1 ? "s" : ""}
                    </span>
                  </button>

                  {expanded && (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderTop: "1px solid #343434",
                        background: "#0f0f10",
                        color: "#ffffff",
                      }}
                    >
                      {entries.length === 0 ? (
                        <p style={{ margin: 0, color: "#ffffff" }}>
                          No pulls in this collection.
                        </p>
                      ) : (
                        entries.map((entry) => (
                          <div
                            key={entry._id}
                            style={{
                              border: "1px solid #343434",
                              padding: "12px",
                              marginBottom: "12px",
                              background: "#181818",
                              color: "#ffffff",
                              borderRadius: "0.65rem",
                            }}
                          >
                            <div className="collection-item-row">
                              <ShirtImage
                                src={entry.shirt?.image}
                                alt={entry.shirt?.name || "Shirt"}
                                size="sm"
                              />
                              <div style={{ color: "#ffffff" }}>
                                <p>
                                  <strong>Shirt:</strong>{" "}
                                  {entry.shirt?.name || "Unknown"}
                                </p>
                                <p>
                                  <strong>Pack:</strong> {entry.pack?.name || "—"}
                                </p>
                                <p>
                                  <strong>Tag:</strong> {entry.tag || "Gildan"}
                                </p>
                                <p>
                                  <strong>Single stitch:</strong>{" "}
                                  {entry.singleStitch ? "Yes" : "No"}
                                </p>
                                <p style={{ fontSize: "0.85rem", opacity: 0.85 }}>
                                  Entry ID: {entry._id}
                                </p>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  style={{ marginTop: "8px" }}
                                  onClick={() =>
                                    handleRemoveCollectionEntry(entry._id)
                                  }
                                >
                                  Remove from user collection
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}