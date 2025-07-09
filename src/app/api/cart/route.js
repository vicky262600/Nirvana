import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cart from "@/models/Cart";
import { verifyJWT } from "@/lib/auth";

// GET: Get current user's cart
export async function GET(req) {
  await connectDB();
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const decoded = verifyJWT(token);
  const cart = await Cart.findOne({ userId: decoded.id });
  return NextResponse.json(cart || { items: [] });
}

// POST: Update or create cart
export async function POST(req) {
  await connectDB();
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const decoded = verifyJWT(token);
  const { items } = await req.json();

  try {
    const updatedCart = await Cart.findOneAndUpdate(
      { userId: decoded.id },
      { items },
      { upsert: true, new: true }
    );
    return NextResponse.json(updatedCart);
  } catch (error) {
    return NextResponse.json({ message: "Cart update failed", error: error.message }, { status: 500 });
  }
}

// DELETE: Clear cart
export async function DELETE(req) {
  await connectDB();
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const decoded = verifyJWT(token);
  await Cart.findOneAndDelete({ userId: decoded.id });
  return NextResponse.json({ message: "Cart cleared" });
}
