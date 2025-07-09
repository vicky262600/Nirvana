import mongoose from "mongoose";

let isConnected = false; // optional flag to avoid reconnects in dev

const dbConnect = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "your_db_name", // optional: specify if you don't use it in URI
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log("MongoDB connected ✅");
  } catch (err) {
    console.error("MongoDB connection failed ❌", err);
    throw err;
  }
};

export default dbConnect;
