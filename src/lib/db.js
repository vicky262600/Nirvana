import mongoose from "mongoose";

let isConnected = false; // optional flag to avoid reconnects in dev

const dbConnect = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "nirvana_ecom", // Updated database name
    });

    isConnected = true;
    console.log("MongoDB connected ✅");
  } catch (err) {
    console.error("MongoDB connection failed ❌", err);
    throw err;
  }
};

export default dbConnect;
