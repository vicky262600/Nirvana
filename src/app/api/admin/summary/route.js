import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import Product from "@/models/Product";
import { verifyJWT } from "@/lib/auth";

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

  if (!decoded.isAdmin) {
    return NextResponse.json({ message: "Admins only" }, { status: 403 });
  }

  try {
    const [totalOrders, totalUsers, totalProducts] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
    ]);

    return NextResponse.json({ totalOrders, totalUsers, totalProducts });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch summary", error: error.message }, { status: 500 });
  }
}
