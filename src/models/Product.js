import mongoose from "mongoose";

// Variant schema: represents a specific combination of size + color
const VariantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  color: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
});

// Product schema
const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    images: { type: [String], required: true },
    categories: { type: [String], default: [] },
    price: { type: Number, required: true },
    onSale: { type: Boolean, default: false },
    salePrice: { type: Number, default: 0 },
    variants: {
      type: [VariantSchema],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
