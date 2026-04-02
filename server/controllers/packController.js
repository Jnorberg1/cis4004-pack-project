import Pack from "../models/Pack.js";
import Shirt from "../models/Shirt.js";
import User from "../models/User.js";
import CollectionEntry from "../models/CollectionEntry.js";
import PackOpeningHistory from "../models/PackOpeningHistory.js";
import { rollBlankTag, rollSingleStitch } from "../utils/blankTagRoll.js";

const utcDayString = () => new Date().toISOString().slice(0, 10);

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

export async function loadPacksWithShirtPool() {
  const packs = await Pack.find().sort({ name: 1 }).lean();
  const shirts = await Shirt.find()
    .populate({ path: "rarity" })
    .populate({ path: "categories" })
    .lean();
  const byPack = {};
  for (const s of shirts) {
    const pid = String(s.pack);
    if (!byPack[pid]) byPack[pid] = [];
    byPack[pid].push(s);
  }
  return packs.map((p) => ({
    ...p,
    shirtPool: byPack[String(p._id)] || [],
  }));
}

/** Ensures the user has two random pack slots for the current UTC day. */
export async function ensureDailyPackSlots(userId) {
  const today = utcDayString();
  const user = await User.findById(userId);
  if (!user) return;

  const state = user.dailyPackState || { utcDay: "", slots: [] };
  const hasTodaySlots =
    state.utcDay === today && Array.isArray(state.slots) && state.slots.length === 2;

  if (hasTodaySlots) return;

  const packs = await Pack.find().select("_id").lean();
  if (packs.length === 0) {
    user.dailyPackState = { utcDay: today, slots: [] };
    await user.save();
    return;
  }

  const slots = [];
  for (let i = 0; i < 2; i++) {
    const pick = packs[Math.floor(Math.random() * packs.length)];
    slots.push({ pack: pick._id, opened: false });
  }
  user.dailyPackState = { utcDay: today, slots };
  await user.save();
}

/**
 * Try to consume one open for `packId`: daily slot first, then bonus queue.
 * @returns {"daily" | "bonus" | null}
 */
async function consumeOpenEntitlement(userId, packId) {
  await ensureDailyPackSlots(userId);
  const user = await User.findById(userId);
  if (!user) return null;

  const pid = String(packId);
  const slots = user.dailyPackState?.slots || [];
  const slot = slots.find((s) => String(s.pack) === pid && !s.opened);
  if (slot) {
    slot.opened = true;
    await user.save();
    return "daily";
  }

  const bonus = user.bonusPackOpens || [];
  const bonusIdx = bonus.findIndex((b) => String(b.pack) === pid);
  if (bonusIdx !== -1) {
    user.bonusPackOpens.splice(bonusIdx, 1);
    await user.save();
    return "bonus";
  }

  return null;
}

export const getAllPacks = async (req, res) => {
  try {
    const packs = await loadPacksWithShirtPool();
    res.json(packs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyPackAvailability = async (req, res) => {
  try {
    await ensureDailyPackSlots(req.user.id);
    const user = await User.findById(req.user.id)
      .populate("dailyPackState.slots.pack")
      .populate("bonusPackOpens.pack")
      .lean();

    const bonusCounts = {};
    for (const b of user.bonusPackOpens || []) {
      const id = b.pack?._id != null ? String(b.pack._id) : String(b.pack);
      bonusCounts[id] = (bonusCounts[id] || 0) + 1;
    }

    res.json({
      utcDay: utcDayString(),
      slots: (user.dailyPackState?.slots || []).map((s) => ({
        pack: s.pack,
        opened: Boolean(s.opened),
      })),
      bonusCounts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const openPack = async (req, res) => {
  try {
    const { packId } = req.params;
    const pack = await Pack.findById(packId);
    if (!pack) {
      return res.status(404).json({ message: "Pack not found" });
    }

    const source = await consumeOpenEntitlement(req.user.id, packId);
    if (!source) {
      return res.status(403).json({
        message:
          "No open available for this pack today. You get two random pack drops per day (UTC), or use a bonus pack from an admin.",
      });
    }

    const shirtPool = await Shirt.find({ pack: pack._id }).populate({
      path: "rarity",
    });

    if (shirtPool.length === 0) {
      const user = await User.findById(req.user.id);
      if (user) {
        if (source === "daily") {
          const slot = (user.dailyPackState?.slots || []).find(
            (s) => String(s.pack) === String(pack._id)
          );
          if (slot) slot.opened = false;
        } else {
          user.bonusPackOpens.push({ pack: pack._id });
        }
        await user.save();
      }
      return res.status(400).json({ message: "This pack has no shirts in its pool." });
    }

    const pulledShirts = pullShirtsByRarityWeight(shirtPool, pack.cardsPerPack);

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
      openSource: source,
      results: pulledShirts,
      collectionEntries,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
