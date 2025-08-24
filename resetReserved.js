import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // make sure it points to your .env.local

// import Product from './models/Product.js'; // <-- include .js
import Product from './src/models/Product.js';
import connectDB from './src/lib/db.js';
async function resetReservedFields() {
  await connectDB();

  try {
    const result = await Product.updateMany(
      {},
      { 
        $set: { 
          "variants.$[].reservedQuantity": 0,
          "variants.$[].reservedUntil": null
        } 
      }
    );

    console.log("Update complete:", result.modifiedCount, "products updated.");
    process.exit(0);
  } catch (err) {
    console.error("Error updating products:", err);
    process.exit(1);
  }
}

resetReservedFields();
