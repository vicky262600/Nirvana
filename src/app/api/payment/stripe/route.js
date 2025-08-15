// /app/api/create-payment-intent/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/lib/db";
import Product from "@/models/Product";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  await connectDB();

  try {
    const { items, currency, amount, shipping } = await req.json();
    // const body = await req.json();
    console.log("Backend received:", items);

    // 1️⃣ Inventory check
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    for (let cartItem of items) {
      const product = products.find(p => p._id.toString() === cartItem.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${cartItem.productId}` },
          { status: 400 }
        );
      }

      // Match variant (size + color) & check stock
      const variant = product.variants.find(
        v => v.size === cartItem.selectedSize && v.color === cartItem.selectedColor
      );
      if (!variant || variant.quantity < cartItem.selectedQuantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.title}` },
          { status: 400 }
        );
      }
    }

    // 2️⃣ Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in cents
      currency,
      description: "Order payment",
      metadata: {
        shippingName: `${shipping.firstName} ${shipping.lastName}`,
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingState: shipping.state,
        shippingZip: shipping.zipCode,
        shippingCountry: shipping.country
      },
      automatic_payment_methods: { enabled: true } // enables card + other Stripe methods
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
