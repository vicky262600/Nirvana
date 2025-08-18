// app/api/payment/webhook/route.js
import Stripe from "stripe";
import connectDB from "@/lib/db";
import Order from "@/models/Order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false, // required for Stripe webhooks
  },
};

export async function POST(req) {
  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf);
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      await connectDB();

      // ✅ Parse items safely from JSON
      const items = session.metadata.items
        ? JSON.parse(session.metadata.items).map((i) => ({
            productId: i.productId,
            selectedSize: i.selectedSize,
            selectedColor: i.selectedColor,
            selectedQuantity: Number(i.selectedQuantity),
            name: i.title,
            price: Number(i.price),
          }))
        : [];

      const order = new Order({
        userId: session.client_reference_id || session.metadata.userId || null,
        shippingInfo: {
          email: session.customer_email,
          firstName: session.metadata.shippingName?.split(" ")[0] || "",
          lastName: session.metadata.shippingName?.split(" ")[1] || "",
          address: session.metadata.shippingAddress || "",
          city: session.metadata.shippingCity || "",
          state: session.metadata.shippingState || "",
          zipCode: session.metadata.shippingZip || "",
          country: session.metadata.shippingCountry || "",
        },
        items,
        total: session.amount_total / 100 || 0,
        paymentId: session.payment_intent,
        paymentStatus: "paid",
        status: "confirmed",
      });

      console.log("Session metadata:", session.metadata);
      console.log("Items parsed:", items);
      console.log("Shipping info:", {
        email: session.customer_email,
        name: session.metadata.shippingName,
        address: session.metadata.shippingAddress,
      });

      await order.save();
      console.log("Order saved:", order._id);

      return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err) {
      console.error("Failed to create order:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
