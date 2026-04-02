import mongoose from "mongoose";

const dailySlotSchema = new mongoose.Schema(
  {
    pack: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pack",
      required: true,
    },
    opened: { type: Boolean, default: false },
  },
  { _id: false }
);

const bonusOpenSchema = new mongoose.Schema(
  {
    pack: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pack",
      required: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    dailyPackState: {
      utcDay: { type: String, default: "" },
      slots: { type: [dailySlotSchema], default: [] },
    },
    bonusPackOpens: { type: [bonusOpenSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
