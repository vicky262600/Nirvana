import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // New: shipping form data
    shippingInfo: {
      email: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String }, // optional if not used yet
      // shipmentCharge: { type: Number, default: 0 }, // shipping cost for this order
    },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        title: { type: String, required: true },
        image: { type: String },
        price: { type: Number, required: true },
        selectedSize: { type: String },
        selectedColor: { type: String },
        selectedQuantity: { type: Number, required: true },
      },
    ],

    total: { type: Number, required: true },

    tax: { type: Number, default: 0 },      
    taxRate: { type: Number, default: 0 },
    currency: { type: String },

    shippingCost: { type: Number, default: 0 },
    status: { type: String, default: "pending", enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"] },
    
    // Payment fields
    paymentId: { type: String },
    sessionId: { type: String },
    paymentStatus: { type: String, default: "pending", enum: ["pending", "paid", "failed", "refunded"] },
    
    // Tracking
    trackingNumber: { type: String },
    estimatedDelivery: { type: Date },

    reservedUntil: { type: Date }, // New

  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
