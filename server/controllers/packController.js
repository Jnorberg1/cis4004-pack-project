import Pack from "../models/Pack.js";
import CollectionEntry from "../models/CollectionEntry.js";
import PackOpeningHistory from "../models/PackOpeningHistory.js";
import { rollBlankTag, rollSingleStitch } from "../utils/blankTagRoll.js";

const rarityWeight = (shirt) => {
  const w = shirt?.rarity?.weight;
  if (typeof w === "number" && Number.isFinite(w) && w > 0) return w;
  return 1;
};

/** One weighted pick from `pool` (mutates nothing). */
const pickWeightedShirt = (pool) => {
  if (!pool.length) return null;
  const weights = pool.map(rarityWeight);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
};

/** Up to `count` unique shirts; each draw is weighted by its rarity’s `weight`. */
const pullShirtsByRarityWeight = (shirtPool, count) => {
  const pool = [...shirtPool];
  const picked = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const shirt = pickWeightedShirt(pool);
    if (!shirt) break;
    picked.push(shirt);
    const idx = pool.indexOf(shirt);
    if (idx !== -1) pool.splice(idx, 1);
  }
  return picked;
};

export const getAllPacks = async (req, res) => {
  try {
    const packs = await Pack.find().populate({
      path: "shirtPool",
      populate: { path: "rarity" },
    });
    res.json(packs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const openPack = async (req, res) => {
  try {
    const { packId } = req.params;
    const pack = await Pack.findById(packId).populate({
      path: "shirtPool",
      populate: { path: "rarity" },
    });

    if (!pack) {
      return res.status(404).json({ message: "Pack not found" });
    }

    const pulledShirts = pullShirtsByRarityWeight(
      pack.shirtPool,
      pack.cardsPerPack
    );

    const entryDocs = await Promise.all(
      pulledShirts.map((shirt) => {
        const tag = rollBlankTag();
        return CollectionEntry.create({
          user: req.user.id,
          shirt: shirt._id,
          pack: pack._id,
          tag,
          singleStitch: rollSingleStitch(tag),
        });
      })
    );

    const collectionEntries = await Promise.all(
      entryDocs.map((doc) =>
        CollectionEntry.findById(doc._id)
          .populate({ path: "shirt", populate: { path: "rarity" } })
          .populate("pack")
      )
    );

    await PackOpeningHistory.create({
      user: req.user.id,
      pack: pack._id,
      results: pulledShirts.map((shirt) => shirt._id),
    });

    res.json({
      message: "Pack opened successfully",
      results: pulledShirts,
      collectionEntries,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};