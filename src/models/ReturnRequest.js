// models/ReturnRequest.js
import mongoose from "mongoose";

const ReturnRequestSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order", // links return request to the order
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // links return request to the user
      required: true,
    },
    items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      title: { type: String },
      selectedSize: { type: String },
      selectedColor: { type: String },
      selectedQuantity: { type: Number },
      returnQuantity: { type: Number },
      price: { type: Number }
    }],
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "refunded"],
      default: "pending",
    },
    refundPercentage: {
      type: Number,
      default: 100, // Default to full refund
      min: 0,
      max: 100
    },
    refundAmount: {
      type: Number, // Calculated refund amount
    },
    refundReason: {
      type: String, // Admin's reason for partial refund
    },
    returnTrackingNumber: {
      type: String, // Stallion return shipment tracking number
    }
  },
  { timestamps: true }
);

// Prevent model overwrite issue in Next.js
export default mongoose.models.ReturnRequest ||
  mongoose.model("ReturnRequest", ReturnRequestSchema);
