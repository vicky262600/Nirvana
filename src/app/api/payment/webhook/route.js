// app/api/payment/webhook/route.js
import Stripe from "stripe";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

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
            title: i.title,
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
        tax: Number(session.metadata.tax) || 0,        // ✅ save tax
        taxRate: Number(session.metadata.taxRate) || 0,
        shippingCost: session.metadata.shippingCost || 0,
        paymentId: session.payment_intent,
        sessionId: session.id,
        paymentStatus: "paid",
        status: "confirmed",
      });


      await order.save();
      console.log("Order saved:", order._id);

       // ✅ Prepare Stallion shipment payload
        // ✅ Build Stallion payload
      const shipmentPayload = {
        to_address: {
          name: `${order.shippingInfo.firstName} ${order.shippingInfo.lastName}`,
          address1: order.shippingInfo.address,
          city: order.shippingInfo.city,
          province_code: order.shippingInfo.state,
          postal_code: order.shippingInfo.zipCode,
          country_code: order.shippingInfo.country,
          phone: "1234567890",
          email: order.shippingInfo.email,
          is_residential: true,
        },
        return_address: {
          name: "Your Store Name",
          address1: "123 Main St",
          city: "Toronto",
          province_code: "ON",
          postal_code: "M5V 2H1",
          country_code: "CA",
          phone: "111-222-3333",
          email: "support@yourstore.com",
          is_residential: false,
        },
        is_return: false,
        weight_unit: "lbs",
        weight: 1, // TODO: derive from cart items later
        length: 9,
        width: 12,
        height: 1,
        size_unit: "cm",
        items: order.items.map((item) => ({
          description: item.title,
          sku: item.productId,
          quantity: item.selectedQuantity,
          value: item.price,
          currency: "CAD",
          country_of_origin: "CA",
          hs_code: "123456",
          manufacturer_name: "Your Company",
          manufacturer_address1: "123 Manufacturing Blvd",
          manufacturer_city: "Toronto",
          manufacturer_province_code: "ON",
          manufacturer_postal_code: "M5V 2H1",
          manufacturer_country_code: "CA",
        })),
        package_type: "Parcel",
        signature_confirmation: false,
        postage_type: session.metadata.postageType || "USPS First Class Mail",
        label_format: "pdf",
        is_fba: false,
        is_draft: false,
        insured: true,
      };

      // ✅ Generate a unique Idempotency-Key
      const idempotencyKey = `${session.id}-${uuidv4()}`;
      console.log(shipmentPayload);

      // ✅ Send request to Stallion
      // const stallionRes = await axios.post(
      //   "https://ship.stallionexpress.ca/api/v4/shipments",
      //   shipmentPayload,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${process.env.STALLION_API_KEY}`,
      //       "Content-Type": "application/json",
      //       "Idempotency-Key": idempotencyKey,
      //     },
      //   }
      // );

      // console.log("Stallion shipment created:", stallionRes.data);
      try {
        const stallionRes = await axios.post(
          "https://ship.stallionexpress.ca/api/v4/shipments",
          shipmentPayload,
          {
            headers: {
              Authorization: `Bearer ${process.env.STALLION_API_KEY}`,
              "Content-Type": "application/json",
              "Idempotency-Key": idempotencyKey,
            },
          }
        );
      
        console.log("Stallion response status:", stallionRes.status);
        console.log("Stallion response headers:", stallionRes.headers);
        console.log("Stallion response data:", stallionRes.data);
      } catch (err) {
        console.error("Stallion request failed:", err.response?.data || err.message);
      }
      

      return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err) {
      console.error("Failed to create order:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
