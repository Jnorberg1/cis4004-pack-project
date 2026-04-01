import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollectionEntry",
      required: true,
    },
    toEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollectionEntry",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Trade", tradeSchema);
