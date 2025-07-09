// app/api/orders/[id]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import { verifyJWT } from "@/lib/auth";

export async function GET(req, { params }) {
  await connectDB();
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let decoded;
  try {
    decoded = verifyJWT(token);
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 403 });
  }

  const orderId = params.id;

  try {
    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

    // Only owner or admin
    if (order.userId.toString() !== decoded.id && !decoded.isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ message: "Failed to fetch order", error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  await connectDB();
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let decoded;
  try {
    decoded = verifyJWT(token);
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 403 });
  }

  if (!decoded.isAdmin) return NextResponse.json({ message: "Admins only" }, { status: 403 });

  const orderId = params.id;
  const updateData = await req.json();

  try {
    const updated = await Order.findByIdAndUpdate(orderId, { $set: updateData }, { new: true });
    if (!updated) return NextResponse.json({ message: "Order not found" }, { status: 404 });

    return NextResponse.json({ message: "Order updated", order: updated });
  } catch (err) {
    return NextResponse.json({ message: "Failed to update", error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  await connectDB();
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let decoded;
  try {
    decoded = verifyJWT(token);
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 403 });
  }

  if (!decoded.isAdmin) return NextResponse.json({ message: "Admins only" }, { status: 403 });

  const orderId = params.id;

  try {
    const deleted = await Order.findByIdAndDelete(orderId);
    if (!deleted) return NextResponse.json({ message: "Order not found" }, { status: 404 });

    return NextResponse.json({ message: "Order deleted" });
  } catch (err) {
    return NextResponse.json({ message: "Failed to delete", error: err.message }, { status: 500 });
  }
}
