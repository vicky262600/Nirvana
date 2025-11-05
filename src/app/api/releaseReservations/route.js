import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDB();
    const now = new Date();

    const products = await Product.find({
      "variants.reservedUntil": { $lt: now },
    });

    let releasedCount = 0;

    for (const product of products) {
      let modified = false;
      for (const variant of product.variants) {
        if (variant.reservedUntil && variant.reservedUntil < now) {
          variant.reservedQuantity = 0;
          variant.reservedUntil = null;
          modified = true;
        } else if (variant.reservedQuantity > 0 && !variant.reservedUntil) {
          console.log(
            `Fixing orphaned reservation for product ${product._id}, variant ${variant.size}/${variant.color}`
          );
          variant.reservedQuantity = 0;
          modified = true;
        }
      }
      if (modified) {
        await product.save();
        releasedCount++;
      }
    }

    return NextResponse.json({
      message: "Expired reservations released successfully",
      releasedCount,
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error releasing expired reservations:", error);
    return NextResponse.json(
      { error: "Failed to release reservations" },
      { status: 500 }
    );
  }
}
