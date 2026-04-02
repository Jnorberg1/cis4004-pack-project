import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import Shirt from "../models/Shirt.js";
import Pack from "../models/Pack.js";
import Category from "../models/Category.js";
import Rarity from "../models/Rarity.js";
import CollectionEntry from "../models/CollectionEntry.js";
import { cancelPendingTradesContainingEntryId } from "../controllers/tradeController.js";

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

const shirtPayloadFromBody = (body) => ({
  name: body.name,
  brand: body.brand,
  description: body.description ?? "",
  image: typeof body.image === "string" ? body.image.trim() : "",
  rarity: body.rarity,
  categories: Array.isArray(body.categories) ? body.categories : [],
  valueScore: Number(body.valueScore) || 0,
});

router.post("/shirts", async (req, res) => {
  try {
    const shirt = await Shirt.create(shirtPayloadFromBody(req.body));
    const populated = await Shirt.findById(shirt._id).populate("rarity categories");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/shirts", async (req, res) => {
  try {
    const shirts = await Shirt.find().populate("rarity categories").sort({ createdAt: -1 });
    res.json(shirts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/shirts/:id", async (req, res) => {
  try {
    const shirt = await Shirt.findByIdAndUpdate(
      req.params.id,
      shirtPayloadFromBody(req.body),
      { new: true, runValidators: true }
    ).populate("rarity categories");
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

router.post("/packs", async (req, res) => {
  try {
    const pack = await Pack.create(req.body);
    res.status(201).json(pack);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/packs", async (req, res) => {
  try {
    const packs = await Pack.find().populate("shirtPool");
    res.json(packs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/packs/:id", async (req, res) => {
  try {
    const pack = await Pack.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(pack);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/packs/:id", async (req, res) => {
  try {
    await Pack.findByIdAndDelete(req.params.id);
    res.json({ message: "Pack deleted" });
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