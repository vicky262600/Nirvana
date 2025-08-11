// Inventory management API
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";

// GET: Check inventory for specific products
export async function GET(req) {
  await connectDB();
  
  try {
    const url = new URL(req.url);
    const productIds = url.searchParams.get("productIds");
    
    if (!productIds) {
      return NextResponse.json({ error: "Product IDs required" }, { status: 400 });
    }
    
    const ids = productIds.split(',');
    const products = await Product.find({ _id: { $in: ids } });
    
    const inventory = products.map(product => ({
      productId: product._id,
      title: product.title,
      variants: product.variants
    }));
    
    return NextResponse.json({ inventory });
  } catch (error) {
    console.error('Inventory check error:', error);
    return NextResponse.json({ error: 'Failed to check inventory' }, { status: 500 });
  }
}

// POST: Update inventory (for admin use)
export async function POST(req) {
  await connectDB();
  
  try {
    const { productId, variantUpdates } = await req.json();
    
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    // Update specific variants
    variantUpdates.forEach(update => {
      const variant = product.variants.find(v => 
        v.size === update.size && v.color === update.color
      );
      
      if (variant) {
        variant.quantity = update.quantity;
      }
    });
    
    await product.save();
    
    return NextResponse.json({ message: "Inventory updated successfully" });
  } catch (error) {
    console.error('Inventory update error:', error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
} 