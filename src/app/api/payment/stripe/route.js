import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/lib/db";
import Product from "@/models/Product";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  await connectDB();

  try {
    const { items, currency, shipping } = await req.json();
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

    // 2️⃣ Build line_items with productId + image
    const line_items = items.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);

      return {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: product.title,
            description: `${item.selectedSize || ''} ${item.selectedColor || ''}`.trim(),
            images: product.images?.length ? [product.images[0]] : [], // ✅ first image
          },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: item.selectedQuantity,
        // ✅ attach productId in metadata
        // (you’ll be able to read it in checkout.session.completed webhook)
        adjustable_quantity: { enabled: false }, // optional
      };
    });

    // 3️⃣ Add shipping as a line item
    if (shipping && shipping.shippingCost) {
      line_items.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: "Shipping" },
          unit_amount: Math.round(Number(shipping.shippingCost) * 100),
        },
        quantity: 1,
      });
    }

    // 4️⃣ Add tax as a line item
    if (shipping && shipping.tax) {
      line_items.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: "GST/HST (13%)" },
          unit_amount: Math.round(Number(shipping.tax) * 100),
        },
        quantity: 1,
      });
    }

    // 5️⃣ Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  line_items,
  mode: "payment",
  success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
  customer_email: shipping.email,
  metadata: {
    shippingName: `${shipping.firstName} ${shipping.lastName}`,
    shippingAddress: shipping.address,
    shippingCity: shipping.city,
    shippingState: shipping.state,
    shippingZip: shipping.zipCode,
    shippingCountry: shipping.country,
    postageType: shipping.postage_type,
    productIds: productIds.join(","),
    userId: shipping.userId,
    items: JSON.stringify(items.map(i => ({
      productId: i.productId,
      selectedSize: i.selectedSize,
      selectedColor: i.selectedColor,
      selectedQuantity: i.selectedQuantity,
      title: i.title,
      price: i.price
    }))),
    tax: shipping.tax,
    taxRate:shipping.taxRate,
    },
  payment_intent_data: {
    metadata: {
      shippingName: `${shipping.firstName} ${shipping.lastName}`,
      shippingAddress: shipping.address,
      shippingCity: shipping.city,
      shippingState: shipping.state,
      shippingZip: shipping.zipCode,
      shippingCountry: shipping.country,
      shippingCost: shipping.shippingCost,
      postageType: shipping.postage_type,
      productIds: productIds.join(","),
      userId: shipping.userId,
      items: JSON.stringify(items.map(i => ({
        productId: i.productId,
        selectedSize: i.selectedSize,
        selectedColor: i.selectedColor,
        selectedQuantity: i.selectedQuantity,
        title: i.title,
        price: i.price
      }))),
      tax: shipping.tax,
      taxRate:shipping.taxRate,
      },
  },
  shipping_address_collection: {
    allowed_countries: ["CA", "US"],
  },
});


    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Stripe Checkout session error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
