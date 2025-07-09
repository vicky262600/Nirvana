// app/api/orders/income/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import { verifyJWT } from "@/lib/auth";
import mongoose from "mongoose";

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

  if (!decoded.isAdmin) return NextResponse.json({ message: "Admins only" }, { status: 403 });

  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");

  const date = new Date();
  const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
  const prevMonth = new Date(new Date().setMonth(lastMonth.getMonth() - 1));

  try {
    const income = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: prevMonth },
          ...(productId && {
            "items.productId": new mongoose.Types.ObjectId(productId),
          }),
        },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          sales: "$total",
        },
      },
      {
        $group: {
          _id: "$month",
          totalSales: { $sum: "$sales" },
        },
      },
    ]);
    return NextResponse.json(income);
  } catch (err) {
    return NextResponse.json({ message: "Failed to fetch income", error: err.message }, { status: 500 });
  }
}
