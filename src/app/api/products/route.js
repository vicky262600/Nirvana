import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { verifyJWT } from "@/lib/auth";
import { setCorsHeaders } from "@/lib/cors";

export async function OPTIONS() {
  const response = NextResponse.json({}, { status: 200 });
  setCorsHeaders(response);
  return response;
}

// create product (only admin)
export async function POST(req) {
  await connectDB();

  const response = NextResponse.next(); // we'll modify this
  setCorsHeaders(response);

  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

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
    const res = NextResponse.json({ message: "Product created", product: newProduct }, { status: 201 });
    setCorsHeaders(res);
    return res;
  } catch (error) {
    const res = NextResponse.json({ message: "Error creating product", error: error.message }, { status: 500 });
    setCorsHeaders(res);
    return res;
  }
}

// get all the products 
export async function GET() {
  await connectDB();

  try {
    const products = await Product.find().sort({ createdAt: -1 });
    const res = NextResponse.json(products);
    setCorsHeaders(res);
    return res;
  } catch (error) {
    const res = NextResponse.json(
      { message: "Error fetching products", error: error.message },
      { status: 500 }
    );
    setCorsHeaders(res);
    return res;
  }
}
