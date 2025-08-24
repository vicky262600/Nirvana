import cron from 'node-cron';
import connectDB from "../../lib/db.js"; // Only 2 levels up!
import Product from "../../models/Product.js"; // Only 2 levels up!
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });


async function releaseExpiredReservations() {
  try {
    await connectDB();
    const now = new Date();

    const products = await Product.find({ 
      "variants.reservedUntil": { $lt: now } 
    });

    for (const product of products) {
      let modified = false;
      for (const variant of product.variants) {
        if (variant.reservedUntil && variant.reservedUntil < now) {
          variant.reservedQuantity = 0;
          variant.reservedUntil = null;
          modified = true;
        }
      }
      if (modified) await product.save();
    }

    console.log(`Expired reservations released at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("Error releasing expired reservations:", error);
  }
};

releaseExpiredReservations();

// Schedule to run every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('Running expired reservation release...');
  releaseExpiredReservations();
});

console.log('Reservation release scheduler started. Running every 5 minutes.');