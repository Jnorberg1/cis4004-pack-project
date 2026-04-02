import express from "express";
import CollectionEntry from "../models/CollectionEntry.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const leaderboard = await CollectionEntry.aggregate([
      {
        $group: {
          _id: "$shirt",
          pullCount: { $sum: 1 },
          favoriteCount: {
            $sum: {
              $cond: ["$isFavorite", 1, 0],
            },
          },
        },
      },
      { $sort: { pullCount: -1, favoriteCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "shirts",
          localField: "_id",
          foreignField: "_id",
          as: "shirt",
        },
      },
      { $unwind: "$shirt" },
      {
        $lookup: {
          from: "rarities",
          localField: "shirt.rarity",
          foreignField: "_id",
          as: "rarity",
        },
      },
      {
        $unwind: {
          path: "$rarity",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          pullCount: 1,
          favoriteCount: 1,
          shirtName: "$shirt.name",
          brand: "$shirt.brand",
          description: "$shirt.description",
          valueScore: "$shirt.valueScore",
          rarityName: "$rarity.name",
          imageUrl: "$shirt.image",
        },
      },
    ]);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;