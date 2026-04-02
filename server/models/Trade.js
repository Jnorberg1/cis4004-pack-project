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
    fromEntries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CollectionEntry",
      },
    ],
    toEntries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CollectionEntry",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Trade", tradeSchema);
