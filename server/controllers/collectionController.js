import CollectionEntry from "../models/CollectionEntry.js";
import User from "../models/User.js";
import { cancelPendingTradesContainingEntryId } from "./tradeController.js";
import "../models/Rarity.js";
import "../models/Category.js";

export const getCollectionByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({
      username: username.trim(),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        message: "Use My Collection for your own items",
      });
    }

    const items = await CollectionEntry.find({ user: user._id })
      .populate({
        path: "shirt",
        populate: [
          { path: "rarity" },
          { path: "categories" },
        ],
      })
      .populate("pack")
      .sort({ createdAt: -1 });

    res.json({
      user: { id: user._id, username: user.username },
      items,
    });
  } catch (error) {
    console.error("Public collection fetch error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyCollection = async (req, res) => {
  try {
    const items = await CollectionEntry.find({ user: req.user.id })
      .populate({
        path: "shirt",
        populate: [
          { path: "rarity" },
          { path: "categories" },
        ],
      })
      .populate("pack")
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    console.error("Collection fetch error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const item = await CollectionEntry.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!item) {
      return res.status(404).json({ message: "Collection item not found" });
    }

    item.isFavorite = !item.isFavorite;
    await item.save();

    res.json(item);
  } catch (error) {
    console.error("Favorite toggle error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteCollectionItem = async (req, res) => {
  try {
    const item = await CollectionEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!item) {
      return res.status(404).json({ message: "Collection item not found" });
    }

    await cancelPendingTradesContainingEntryId(item._id);

    res.json({ message: "Collection item deleted" });
  } catch (error) {
    console.error("Delete collection item error:", error);
    res.status(500).json({ message: error.message });
  }
};