import { buffer } from "micro";
import Stripe from "stripe";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Cart from "@/models/Cart";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const config = { api: { bodyParser: false } };

export async function POST(req) {
  await connectDB();

  const sig = req.headers.get("stripe-signature");
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Only handle successful checkout sessions
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const shippingInfo = {
        email: session.customer_email,
        firstName: session.metadata.shippingName.split(" ")[0],
        lastName: session.metadata.shippingName.split(" ")[1] || "",
        address: session.metadata.shippingAddress,
        city: session.metadata.shippingCity,
        state: session.metadata.shippingState,
        zipCode: session.metadata.shippingZip,
        country: session.metadata.shippingCountry,
      };

      // Parse items from metadata if you sent them, or fetch them from DB
      // For example, you could store items as JSON in metadata.items
      const items = JSON.parse(session.metadata.items || "[]");

      // Calculate totals
      const total = items.reduce(
        (acc, item) => acc + Number(item.price) * item.selectedQuantity,
        0
      );
      const shippingCost = Number(session.metadata.shippingCost || 0);
      const tax = Number(session.metadata.tax || 0);

      // Update inventory
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) continue;
        const variant = product.variants.find(
          (v) => v.size === item.selectedSize && v.color === item.selectedColor
        );
        if (variant) {
          variant.quantity -= item.selectedQuantity;
          await product.save();
        }
      }

      // Create order
      const newOrder = await Order.create({
        userId: session.metadata.userId, // you can pass userId via metadata
        items,
        total,
        shippingCost,
        shippingInfo,
        status: "confirmed",
        paymentId: session.payment_intent,
        paymentStatus: "paid",
      });

      // Optionally, clear cart
      await Cart.findOneAndDelete({ userId: session.metadata.userId });

      console.log("Order created successfully:", newOrder._id);
    } catch (err) {
      console.error("Error creating order from webhook:", err);
    }
  }

  return new Response("Webhook received", { status: 200 });
}
