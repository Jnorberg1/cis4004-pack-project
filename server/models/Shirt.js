import mongoose from "mongoose";

const shirtSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    rarity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rarity",
      required: true,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Shirt", shirtSchema);