// app/api/orders/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import { verifyJWT } from "@/lib/auth";
import mongoose from "mongoose"; 

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
  const search = url.searchParams.get("search") || "";

  // Build search filter
  let searchFilter = {};
  if (search) {
    const regex = new RegExp(search, "i"); // case-insensitive regex

    // Check if search is a valid ObjectId for _id search
    const isValidObjectId = mongoose.Types.ObjectId.isValid(search);

    // Compose $or array conditionally
    const orConditions = [
      { "shippingInfo.email": regex },
      { "shippingInfo.firstName": regex },
      { "shippingInfo.lastName": regex },
    ];

    if (isValidObjectId) {
      orConditions.push({ _id: search }); // exact match for ObjectId
    }

    searchFilter = { $or: orConditions };
  }

  if (userId) {
    if (decoded.id !== userId && !decoded.isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    try {
      const orders = await Order.find({ userId, ...searchFilter });
      return NextResponse.json({ orders });
    } catch (err) {
      return NextResponse.json({ message: "Failed to fetch orders", error: err.message }, { status: 500 });
    }
  } else {
    if (!decoded.isAdmin) {
      return NextResponse.json({ message: "Admins only" }, { status: 403 });
    }
    try {
      const orders = await Order.find(searchFilter);
      return NextResponse.json({ orders });
    } catch (err) {
      return NextResponse.json({ message: "Failed to fetch orders", error: err.message }, { status: 500 });
    }
  }
}
