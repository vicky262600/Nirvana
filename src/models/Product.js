import mongoose from "mongoose";

// Variant schema: represents a specific combination of size + color
const VariantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  color: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  reservedQuantity: { type: Number, default: 0 }, // reserved but not paid
  reservedUntil: { type: Date },
});

// Product schema
const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    images: { type: [String], required: true },
    categories: { type: [String], default: [] },
    price: { type: Number, required: true },
    isOnSale: { type: Boolean, default: false },
    isNewProduct: { type: Boolean, default: false }, // Renamed from 'isNew' to avoid reserved keyword
    salePrice: { type: Number, default: 0 },
    variants: {
      type: [VariantSchema],
      required: true,
    },
  },
  { 
    timestamps: true,
    suppressReservedKeysWarning: true // Suppress the warning about reserved keywords
  }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
