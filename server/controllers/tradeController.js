import User from "../models/User.js";
import Trade from "../models/Trade.js";
import CollectionEntry from "../models/CollectionEntry.js";

const entryPopulate = {
  path: "shirt",
  populate: [{ path: "rarity" }, { path: "categories" }],
};

const populateTrade = [
  { path: "fromUser", select: "username" },
  { path: "toUser", select: "username" },
  { path: "fromEntries", populate: entryPopulate },
  { path: "toEntries", populate: entryPopulate },
];

function normalizeIdArray(raw) {
  if (raw == null) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return [...new Set(list.map((id) => String(id)).filter(Boolean))];
}

async function entriesOwnedByUser(entryIds, userId) {
  if (entryIds.length === 0) return [];
  return CollectionEntry.find({
    _id: { $in: entryIds },
    user: userId,
  });
}

/** Each fromEntry must exist and belong to fromUser; each toEntry to toUser. */
async function pendingTradeInventoryIsValid(trade) {
  for (const entryId of trade.fromEntries || []) {
    const doc = await CollectionEntry.findById(entryId);
    if (!doc) return false;
    if (doc.user.toString() !== trade.fromUser.toString()) return false;
  }
  for (const entryId of trade.toEntries || []) {
    const doc = await CollectionEntry.findById(entryId);
    if (!doc) return false;
    if (doc.user.toString() !== trade.toUser.toString()) return false;
  }
  return true;
}

export async function cancelInvalidPendingTradesForUsers(userIds) {
  const unique = [...new Set(userIds.map((id) => String(id)))].filter(Boolean);
  if (unique.length === 0) return;

  const trades = await Trade.find({
    status: "pending",
    $or: [{ fromUser: { $in: unique } }, { toUser: { $in: unique } }],
  });

  for (const trade of trades) {
    const ok = await pendingTradeInventoryIsValid(trade);
    if (!ok) {
      trade.status = "cancelled";
      await trade.save();
    }
  }
}

/** Call when a collection entry is removed — any pending trade listing it is cancelled. */
export async function cancelPendingTradesContainingEntryId(entryId) {
  if (!entryId) return;
  await Trade.updateMany(
    {
      status: "pending",
      $or: [{ fromEntries: entryId }, { toEntries: entryId }],
    },
    { $set: { status: "cancelled" } }
  );
}

export const createTrade = async (req, res) => {
  try {
    const { toUsername, myEntryIds, theirEntryIds } = req.body;

    if (!toUsername?.trim()) {
      return res.status(400).json({ message: "toUsername is required" });
    }

    const myIds = normalizeIdArray(myEntryIds);
    const theirIds = normalizeIdArray(theirEntryIds);

    if (myIds.length === 0 && theirIds.length === 0) {
      return res.status(400).json({
        message: "Offer at least one shirt on your side, their side, or both",
      });
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

    const myEntries = await entriesOwnedByUser(myIds, req.user.id);
    if (myEntries.length !== myIds.length) {
      return res.status(404).json({
        message: "One or more of your selected items were not found",
      });
    }

    const theirEntries = await entriesOwnedByUser(theirIds, toUser._id);
    if (theirEntries.length !== theirIds.length) {
      return res.status(404).json({
        message:
          "One or more of their selected items were not found or do not belong to that user",
      });
    }

    const trade = await Trade.create({
      fromUser: req.user.id,
      toUser: toUser._id,
      fromEntries: myIds,
      toEntries: theirIds,
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
    await cancelInvalidPendingTradesForUsers([req.user.id]);

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

    const valid = await pendingTradeInventoryIsValid(trade);
    if (!valid) {
      trade.status = "cancelled";
      await trade.save();
      return res.status(409).json({
        message:
          "This trade was cancelled because an item is missing or no longer in someone’s collection.",
      });
    }

    const fromIds = (trade.fromEntries || []).map((id) => id.toString());
    const toIds = (trade.toEntries || []).map((id) => id.toString());

    const fromDocs =
      fromIds.length > 0
        ? await CollectionEntry.find({ _id: { $in: fromIds } })
        : [];
    const toDocs =
      toIds.length > 0 ? await CollectionEntry.find({ _id: { $in: toIds } }) : [];

    const rolledBack = [];

    try {
      for (const doc of fromDocs) {
        rolledBack.push({ doc, prevOwner: doc.user });
        doc.user = trade.toUser;
        await doc.save();
      }
      for (const doc of toDocs) {
        rolledBack.push({ doc, prevOwner: doc.user });
        doc.user = trade.fromUser;
        await doc.save();
      }
    } catch (innerError) {
      for (const { doc, prevOwner } of rolledBack.reverse()) {
        doc.user = prevOwner;
        await doc.save();
      }
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
