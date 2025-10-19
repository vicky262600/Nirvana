// lib/firebaseAdmin.js
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

if (!getApps().length) {
  try {
    // Check if the environment variable exists and is valid
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 environment variable is not set");
    }

    const serviceAccountKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, "base64").toString("utf-8");
    
    // Validate that the decoded string is valid JSON
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountKey);
    } catch (jsonError) {
      console.error("Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY_BASE64:", jsonError.message);
      console.error("Decoded string preview:", serviceAccountKey.substring(0, 100) + "...");
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 contains invalid JSON");
    }

    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error.message);
    // Don't throw here to prevent the entire app from crashing
    // The app can still run without Firebase functionality
  }
}

let storage, bucket;

try {
  storage = getStorage();
  bucket = storage.bucket();
} catch (error) {
  console.error("Failed to get Firebase storage:", error.message);
  // Create a mock bucket object to prevent crashes
  bucket = {
    file: () => ({
      delete: () => Promise.resolve(),
      upload: () => Promise.resolve([{ name: 'mock-file' }]),
      getSignedUrl: () => Promise.resolve(['mock-url'])
    })
  };
}

export { bucket };
