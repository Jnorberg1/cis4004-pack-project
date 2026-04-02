import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import Shirt from "../models/Shirt.js";
import Pack from "../models/Pack.js";
import Category from "../models/Category.js";
import Rarity from "../models/Rarity.js";
import CollectionEntry from "../models/CollectionEntry.js";
import User from "../models/User.js";
import { cancelPendingTradesContainingEntryId } from "../controllers/tradeController.js";
import { BLANK_TAG_ENUM } from "../utils/blankTagRoll.js";
import { loadPacksWithShirtPool } from "../controllers/packController.js";

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

const shirtPayloadFromBody = (body) => ({
  name: body.name,
  brand: body.brand,
  description: body.description ?? "",
  image: typeof body.image === "string" ? body.image.trim() : "",
  rarity: body.rarity,
  categories: Array.isArray(body.categories) ? body.categories : [],
  pack: body.pack,
});

router.post("/shirts", async (req, res) => {
  try {
    const payload = shirtPayloadFromBody(req.body);
    if (!payload.pack) {
      return res.status(400).json({ message: "pack is required (each shirt belongs to one pack)" });
    }
    const packExists = await Pack.findById(payload.pack).select("_id");
    if (!packExists) {
      return res.status(400).json({ message: "Pack not found" });
    }
    const shirt = await Shirt.create(payload);
    const populated = await Shirt.findById(shirt._id).populate(
      "rarity categories pack"
    );
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/shirts", async (req, res) => {
  try {
    const shirts = await Shirt.find()
      .populate("rarity categories pack")
      .sort({ createdAt: -1 });
    res.json(shirts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/shirts/:id", async (req, res) => {
  try {
    const payload = shirtPayloadFromBody(req.body);
    if (!payload.pack) {
      return res.status(400).json({ message: "pack is required" });
    }
    const packExists = await Pack.findById(payload.pack).select("_id");
    if (!packExists) {
      return res.status(400).json({ message: "Pack not found" });
    }
    const shirt = await Shirt.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate("rarity categories pack");
    if (!shirt) {
      return res.status(404).json({ message: "Shirt not found" });
    }
    res.json(shirt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/shirts/:id", async (req, res) => {
  try {
    await Shirt.findByIdAndDelete(req.params.id);
    res.json({ message: "Shirt deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const packPayloadFromBody = (body, defaults = {}) => ({
  name: body.name ?? defaults.name,
  description:
    typeof body.description === "string"
      ? body.description
      : (defaults.description ?? ""),
  cardsPerPack:
    typeof body.cardsPerPack === "number" && Number.isFinite(body.cardsPerPack)
      ? Math.max(1, Math.floor(body.cardsPerPack))
      : (defaults.cardsPerPack ?? 3),
});

router.post("/packs", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }
    const pack = await Pack.create(
      packPayloadFromBody({ ...req.body, name: name.trim() })
    );
    const [withPool] = await loadPacksWithShirtPool().then((packs) =>
      packs.filter((p) => String(p._id) === String(pack._id))
    );
    res.status(201).json(withPool || pack);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/packs", async (req, res) => {
  try {
    const packs = await loadPacksWithShirtPool();
    res.json(packs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/packs/:id", async (req, res) => {
  try {
    const existing = await Pack.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Pack not found" });
    }
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== "string" || !req.body.name.trim()) {
        return res.status(400).json({ message: "name must be a non-empty string" });
      }
    }
    const merged = packPayloadFromBody(req.body, {
      name: existing.name,
      description: existing.description,
      cardsPerPack: existing.cardsPerPack,
    });
    if (req.body.name !== undefined) {
      merged.name = req.body.name.trim();
    }
    const pack = await Pack.findByIdAndUpdate(req.params.id, merged, {
      new: true,
      runValidators: true,
    });
    const [withPool] = await loadPacksWithShirtPool().then((packs) =>
      packs.filter((p) => String(p._id) === String(pack._id))
    );
    res.json(withPool || pack);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/packs/:id", async (req, res) => {
  try {
    const count = await Shirt.countDocuments({ pack: req.params.id });
    if (count > 0) {
      return res.status(400).json({
        message: `Cannot delete pack: ${count} shirt(s) are assigned to it. Move or delete those shirts first.`,
      });
    }
    await Pack.findByIdAndDelete(req.params.id);
    res.json({ message: "Pack deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/users/:userId/grant-packs", async (req, res) => {
  try {
    const { userId } = req.params;
    const { packId, count = 1 } = req.body;
    if (!packId) {
      return res.status(400).json({ message: "packId is required" });
    }
    const n = Math.min(50, Math.max(1, parseInt(count, 10) || 1));
    const [user, pack] = await Promise.all([
      User.findById(userId).select("_id username"),
      Pack.findById(packId).select("_id name"),
    ]);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!pack) {
      return res.status(404).json({ message: "Pack not found" });
    }
    const pushes = Array.from({ length: n }, () => ({ pack: pack._id }));
    await User.findByIdAndUpdate(userId, {
      $push: { bonusPackOpens: { $each: pushes } },
    });
    res.status(201).json({
      message: `Granted ${n} bonus open(s) of "${pack.name}" to ${user.username}.`,
      granted: n,
      packId: pack._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/rarities", async (req, res) => {
  try {
    const rarities = await Rarity.find().sort({ weight: 1 });
    res.json(rarities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("username role").sort({ username: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/collection-entries", async (req, res) => {
  try {
    const entries = await CollectionEntry.find()
      .populate("user", "username role")
      .populate({
        path: "shirt",
        populate: [{ path: "rarity" }, { path: "categories" }],
      })
      .populate("pack")
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/blank-tags", (req, res) => {
  res.json({ tags: BLANK_TAG_ENUM });
});

router.post("/collection-entries", async (req, res) => {
  try {
    const { user: userId, shirt: shirtId, tag: rawTag, singleStitch } = req.body;
    if (!userId || !shirtId) {
      return res.status(400).json({ message: "user and shirt are required" });
    }

    const tagTrimmed =
      typeof rawTag === "string" && rawTag.trim() ? rawTag.trim() : "Gildan";
    if (!BLANK_TAG_ENUM.includes(tagTrimmed)) {
      return res.status(400).json({
        message: `tag must be one of: ${BLANK_TAG_ENUM.join(", ")}`,
      });
    }

    const [userDoc, shirtDoc] = await Promise.all([
      User.findById(userId).select("_id"),
      Shirt.findById(shirtId).select("_id"),
    ]);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!shirtDoc) {
      return res.status(404).json({ message: "Shirt not found" });
    }

    const entry = await CollectionEntry.create({
      user: userId,
      shirt: shirtId,
      pack: null,
      tag: tagTrimmed,
      singleStitch: Boolean(singleStitch),
    });

    const populated = await CollectionEntry.findById(entry._id)
      .populate("user", "username role")
      .populate({
        path: "shirt",
        populate: [{ path: "rarity" }, { path: "categories" }],
      })
      .populate("pack");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/collection-entries/:id", async (req, res) => {
  try {
    const entry = await CollectionEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Collection entry not found" });
    }
    await cancelPendingTradesContainingEntryId(entry._id);
    res.json({ message: "Removed from user collection" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;