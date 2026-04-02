import express from "express";
import User from "../models/User.js";
import CollectionEntry from "../models/CollectionEntry.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const entryCollection = CollectionEntry.collection.name;

    const leaderboard = await User.aggregate([
      {
        $lookup: {
          from: entryCollection,
          localField: "_id",
          foreignField: "user",
          as: "entries",
        },
      },
      {
        $addFields: {
          shirtCount: { $size: "$entries" },
        },
      },
      {
        $project: {
          userId: "$_id",
          username: 1,
          role: 1,
          shirtCount: 1,
        },
      },
      { $sort: { shirtCount: -1, username: 1 } },
    ]);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
