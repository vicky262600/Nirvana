import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { verifyJWT } from "@/lib/auth";

export async function GET(req) {
  await connectDB();

  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded.isAdmin) return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });

    // Parse URL params for pagination and search
    const { search = "", limit = 20 } = Object.fromEntries(new URL(req.url).searchParams);

    // Build search filter
    let filter = {};
    if (search) {
      const regex = new RegExp(search, "i"); // case-insensitive
      filter = {
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
        ],
      };
    }

    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter, { password: 0 })
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return NextResponse.json({ totalUsers, users }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Something went wrong", error: err.message }, { status: 500 });
  }
}
