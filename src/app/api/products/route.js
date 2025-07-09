import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { verifyJWT } from "@/lib/auth";


// create product (only admin)
export async function POST(req) {
  await connectDB();

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = verifyJWT(token);
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 403 });
  }

  if (!decoded.isAdmin) {
    return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
  }

  const productData = await req.json();

  // Basic validation
  if (
    !productData.title ||
    !productData.description ||
    !productData.images ||
    !productData.price ||
    !productData.variants
  ) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  try {
    const newProduct = await Product.create(productData);
    return NextResponse.json({ message: "Product created", product: newProduct }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error creating product", error: error.message }, { status: 500 });
  }
}

// get all the products 
export async function GET() {
  await connectDB();

  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching products", error: error.message },
      { status: 500 }
    );
  }
}
