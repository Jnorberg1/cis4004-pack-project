import User from "../models/User.js";
import Trade from "../models/Trade.js";
import CollectionEntry from "../models/CollectionEntry.js";

const populateTrade = [
  { path: "fromUser", select: "username" },
  { path: "toUser", select: "username" },
  {
    path: "fromEntry",
    populate: {
      path: "shirt",
      populate: [{ path: "rarity" }, { path: "categories" }],
    },
  },
  {
    path: "toEntry",
    populate: {
      path: "shirt",
      populate: [{ path: "rarity" }, { path: "categories" }],
    },
  },
];

export const createTrade = async (req, res) => {
  try {
    const { toUsername, myEntryId, theirEntryId } = req.body;

    if (!toUsername || !myEntryId || !theirEntryId) {
      return res
        .status(400)
        .json({ message: "toUsername, myEntryId, and theirEntryId are required" });
    }

    const toUser = await User.findOne({
      username: toUsername.trim(),
    });

    if (!toUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (toUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot trade with yourself" });
    }

    const myEntry = await CollectionEntry.findOne({
      _id: myEntryId,
      user: req.user.id,
    });

    if (!myEntry) {
      return res.status(404).json({ message: "Your collection item was not found" });
    }

    const theirEntry = await CollectionEntry.findOne({
      _id: theirEntryId,
      user: toUser._id,
    });

    if (!theirEntry) {
      return res
        .status(404)
        .json({ message: "Their collection item was not found or does not belong to that user" });
    }

    const existing = await Trade.findOne({
      status: "pending",
      $or: [
        { fromEntry: myEntryId },
        { toEntry: myEntryId },
        { fromEntry: theirEntryId },
        { toEntry: theirEntryId },
      ],
    });

    if (existing) {
      return res.status(409).json({
        message: "One of these items is already part of another pending trade",
      });
    }

    const trade = await Trade.create({
      fromUser: req.user.id,
      toUser: toUser._id,
      fromEntry: myEntry._id,
      toEntry: theirEntry._id,
    });

    const populated = await Trade.findById(trade._id).populate(populateTrade);

    res.status(201).json(populated);
  } catch (error) {
    console.error("Create trade error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyTrades = async (req, res) => {
  try {
    const trades = await Trade.find({
      $or: [{ fromUser: req.user.id }, { toUser: req.user.id }],
    })
      .populate(populateTrade)
      .sort({ createdAt: -1 });

    res.json(trades);
  } catch (error) {
    console.error("List trades error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const acceptTrade = async (req, res) => {
  try {
    const trade = await Trade.findOne({
      _id: req.params.id,
      toUser: req.user.id,
      status: "pending",
    });

    if (!trade) {
      return res.status(404).json({
        message: "Pending trade not found or you are not the recipient",
      });
    }

    const fromEntry = await CollectionEntry.findById(trade.fromEntry);
    const toEntry = await CollectionEntry.findById(trade.toEntry);

    if (
      !fromEntry ||
      !toEntry ||
      fromEntry.user.toString() !== trade.fromUser.toString() ||
      toEntry.user.toString() !== trade.toUser.toString()
    ) {
      return res.status(409).json({
        message: "Items no longer match this trade; cancel it and try again",
      });
    }

    const dup = await Trade.findOne({
      _id: { $ne: trade._id },
      status: "pending",
      $or: [
        { fromEntry: trade.fromEntry },
        { toEntry: trade.fromEntry },
        { fromEntry: trade.toEntry },
        { toEntry: trade.toEntry },
      ],
    });

    if (dup) {
      return res.status(409).json({
        message: "Another pending trade conflicts with these items",
      });
    }

    const originalFromOwner = fromEntry.user;
    const originalToOwner = toEntry.user;

    fromEntry.user = trade.toUser;
    await fromEntry.save();

    try {
      toEntry.user = trade.fromUser;
      await toEntry.save();
    } catch (innerError) {
      fromEntry.user = originalFromOwner;
      await fromEntry.save();
      throw innerError;
    }

    trade.status = "accepted";
    await trade.save();

    const populated = await Trade.findById(trade._id).populate(populateTrade);
    res.json(populated);
  } catch (error) {
    console.error("Accept trade error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const declineTrade = async (req, res) => {
  try {
    const trade = await Trade.findOneAndUpdate(
      {
        _id: req.params.id,
        toUser: req.user.id,
        status: "pending",
      },
      { status: "declined" },
      { new: true }
    ).populate(populateTrade);

    if (!trade) {
      return res.status(404).json({
        message: "Pending trade not found or you are not the recipient",
      });
    }

    res.json(trade);
  } catch (error) {
    console.error("Decline trade error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const cancelTrade = async (req, res) => {
  try {
    const trade = await Trade.findOneAndUpdate(
      {
        _id: req.params.id,
        fromUser: req.user.id,
        status: "pending",
      },
      { status: "cancelled" },
      { new: true }
    ).populate(populateTrade);

    if (!trade) {
      return res.status(404).json({
        message: "Pending trade not found or you are not the sender",
      });
    }

    res.json(trade);
  } catch (error) {
    console.error("Cancel trade error:", error);
    res.status(500).json({ message: error.message });
  }
};
