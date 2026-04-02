import mongoose from "mongoose";

const packSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    cardsPerPack: { type: Number, default: 3 },
  },
  { timestamps: true }
);

export default mongoose.model("Pack", packSchema);
