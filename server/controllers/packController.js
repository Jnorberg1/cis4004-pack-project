import Pack from "../models/Pack.js";
import CollectionEntry from "../models/CollectionEntry.js";
import PackOpeningHistory from "../models/PackOpeningHistory.js";

const getRandomItems = (items, count) => {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
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

    const pulledShirts = getRandomItems(pack.shirtPool, pack.cardsPerPack);

    const collectionEntries = await Promise.all(
      pulledShirts.map((shirt) =>
        CollectionEntry.create({
          user: req.user.id,
          shirt: shirt._id,
          pack: pack._id,
        })
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