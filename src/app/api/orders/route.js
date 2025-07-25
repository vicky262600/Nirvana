// app/api/orders/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import { verifyJWT } from "@/lib/auth";

export async function POST(req) {
  await connectDB();

  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let decoded;
  try {
    decoded = verifyJWT(token);
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 403 });
  }

  const userId = decoded.id;
  const { items, total, shippingInfo } = await req.json();

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ message: "Cart is empty" }, { status: 400 });
  }
  if (!total || total <= 0) {
    return NextResponse.json({ message: "Invalid total amount" }, { status: 400 });
  }

  if (
    !shippingInfo ||
    !shippingInfo.email ||
    !shippingInfo.firstName ||
    !shippingInfo.lastName ||
    !shippingInfo.address ||
    !shippingInfo.city ||
    !shippingInfo.state ||
    !shippingInfo.zipCode
  ) {
    return NextResponse.json({ message: "Incomplete shipping information" }, { status: 400 });
  }

  try {
    const newOrder = await Order.create({
      userId,
      items,
      total,
      shippingInfo,
      status: "pending",
    });
    return NextResponse.json({ message: "Order placed successfully", order: newOrder }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to place order", error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  await connectDB();

  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let decoded;
  try {
    decoded = verifyJWT(token);
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 403 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (userId) {
    if (decoded.id !== userId && !decoded.isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    try {
      const orders = await Order.find({ userId });
      return NextResponse.json(orders);
    } catch (err) {
      return NextResponse.json({ message: "Failed to fetch orders", error: err.message }, { status: 500 });
    }
  } else {
    if (!decoded.isAdmin) {
      return NextResponse.json({ message: "Admins only" }, { status: 403 });
    }
    try {
      const orders = await Order.find();
      return NextResponse.json(orders);
    } catch (err) {
      return NextResponse.json({ message: "Failed to fetch orders", error: err.message }, { status: 500 });
    }
  }
}
