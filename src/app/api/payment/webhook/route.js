// app/api/payment/webhook/route.js
import Stripe from "stripe";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false, // required for Stripe webhooks
  },
};

export async function POST(req) {
  console.log('Webhook received:', req.method, req.url);
  
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

  console.log('Processing webhook event:', event.type);
  
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    let dbSession = null; // Declare outside try block

    try {
      await connectDB();

      // Start a database transaction for atomicity
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();

      // Parse items from Stripe metadata
      const items = session.metadata.items ? JSON.parse(session.metadata.items) : [];

      // Enrich items with product images from DB and update stock
      const enrichedItems = await Promise.all(
        items.map(async (cartItem) => {
          const product = await Product.findById(cartItem.productId);

          if (product) {
            // Update stock & reserved quantity
            const variant = product.variants.find(
              (v) => v.size === cartItem.selectedSize && v.color === cartItem.selectedColor
            );
            if (variant) {
              // Ensure we don't go below 0
              const newReservedQuantity = Math.max((variant.reservedQuantity || 0) - Number(cartItem.selectedQuantity), 0);
              
              variant.quantity -= Number(cartItem.selectedQuantity);
              variant.reservedQuantity = newReservedQuantity;
              
              // Only set reservedUntil to null if reservedQuantity is 0
              if (newReservedQuantity === 0) {
                variant.reservedUntil = null;
              }
              
              await product.save({ session: dbSession });
            }
          }

          return {
            productId: cartItem.productId,
            selectedSize: cartItem.selectedSize,
            selectedColor: cartItem.selectedColor,
            selectedQuantity: Number(cartItem.selectedQuantity),
            title: cartItem.title,
            price: Number(cartItem.price),
            image: product?.images?.[0] || null, // first image from DB
          };
        })
      );

      // Prepare Stallion shipment payload
      const shipmentPayload = {
        to_address: {
          name: session.metadata.shippingName,
          address1: session.metadata.shippingAddress,
          city: session.metadata.shippingCity,
          province_code: session.metadata.shippingState,
          postal_code: session.metadata.shippingZip,
          country_code: session.metadata.shippingCountry,
          phone: "1234567890",
          email: session.customer_email,
          is_residential: true,
        },
        return_address: {
          name: "Nirvana",
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
        weight: 2, // TODO: calculate from cart items if needed
        length: 30,
        width: 20,
        height: 5,
        size_unit: "cm",
        items: enrichedItems.map((item) => ({
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

      const idempotencyKey = `${session.id}-${uuidv4()}`;

      // Call Stallion API
      let trackingNumber = null;
      try {
        const stallionRes = await axios.post(
          "https://sandbox.stallionexpress.ca/api/v4/shipments",
          shipmentPayload,
          {
            headers: {
              Authorization: `Bearer ${process.env.STALLION_API_KEY}`,
              "Content-Type": "application/json",
              "Idempotency-Key": idempotencyKey,
            },
          }
        );
        trackingNumber = stallionRes.data.shipment?.tracking_code || null;
        console.log("Stallion tracking number:", trackingNumber);
      } catch (err) {
        console.error("Stallion request failed:", err.response?.data || err.message);
      }

      // Debug: Log the session metadata
      console.log('Session metadata:', session.metadata);
      console.log('Session currency:', session.currency);
      
      // Create order with tracking number and enriched items
      const orderData = {
        userId: session.client_reference_id || session.metadata.userId || null,
        shippingInfo: {
          email: session.customer_email,
          firstName: session.metadata.shippingName?.split(" ")[0] || "",
          lastName: session.metadata.shippingName?.split(" ")[1] || "",
          address: session.metadata.shippingAddress,
          city: session.metadata.shippingCity,
          state: session.metadata.shippingState,
          zipCode: session.metadata.shippingZip,
          country: session.metadata.shippingCountry,
        },
        items: enrichedItems,
        tax: Number(session.metadata.tax) || 0,
        currency: (session.metadata.currency || "USD").toUpperCase(),
        total: session.amount_total / 100 || 0,
        taxRate: Number(session.metadata.taxRate) || 0,
        shippingCost: session.metadata.shippingCost || 0,
        paymentId: session.payment_intent,
        sessionId: session.id,
        paymentStatus: "paid",
        status: "confirmed",
        trackingNumber,
      };

      console.log('Creating order with data:', orderData);
      
      const order = new Order(orderData);

      await order.save({ session: dbSession });
      console.log("Order saved with tracking and images:", order._id);

      // Commit the transaction
      await dbSession.commitTransaction();
      console.log("Database transaction committed successfully");

      return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err) {
      console.error("Order creation failed:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        response: err.response?.data
      });
      
      // Rollback the transaction on error
      if (dbSession && dbSession.inTransaction()) {
        await dbSession.abortTransaction();
        console.log("Database transaction rolled back");
      }
      
      return new Response("Internal Server Error", { status: 500 });
    } finally {
      // End the session
      if (dbSession) {
        await dbSession.endSession();
        console.log("Database session ended");
      }
    }
  }

  // Handle other webhook event types
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
