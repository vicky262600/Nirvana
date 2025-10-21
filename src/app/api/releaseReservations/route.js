import connectDB from "../../../lib/db";
import Product from "../../../models/Product";

export async function GET(req) {
  try {
    await connectDB();
    const now = new Date();

    const products = await Product.find({ "variants.reservedUntil": { $lt: now } });

    for (const product of products) {
      let modified = false;
      for (const variant of product.variants) {
        if (variant.reservedUntil && variant.reservedUntil < now) {
          variant.reservedQuantity = 0;
          variant.reservedUntil = null;
          modified = true;
        }
        else if (variant.reservedQuantity > 0 && !variant.reservedUntil) {
          console.log(`Fixing orphaned reservation for ${product._id}`);
          variant.reservedQuantity = 0;
          modified = true;
        }
      }
      if (modified) await product.save();
    }

    return new Response(
      JSON.stringify({ message: "Expired reservations released successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error releasing expired reservations:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
