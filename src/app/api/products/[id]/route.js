import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { verifyJWT } from "@/lib/auth";


export async function GET(req, { params }) {
    await connectDB();
    const id = await params.id;
  
  try {
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid product ID", error: error.message },
      { status: 400 }
    );
  }
}

// Update product (only admin)
export async function PUT(req, context) {
    await connectDB();
    const { id } = context.params;
  
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
    try {
      const decoded = verifyJWT(token);
      if (!decoded.isAdmin) {
        return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
      }
  
      const data = await req.json();
      const updatedProduct = await Product.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
  
      return NextResponse.json({ message: "Product updated", product: updatedProduct });
    } catch (error) {
      return NextResponse.json({ message: "Error updating", error: error.message }, { status: 500 });
    }
  }
  
  // DELETE - Remove product (admin only)
  export async function DELETE(req, context) {
    await connectDB();
    const { id } = context.params;
  
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
    try {
      const decoded = verifyJWT(token);
      if (!decoded.isAdmin) {
        return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
      }
  
      await Product.findByIdAndDelete(id);
      return NextResponse.json({ message: "Product deleted" });
    } catch (error) {
      return NextResponse.json({ message: "Error deleting", error: error.message }, { status: 500 });
    }
  }
  