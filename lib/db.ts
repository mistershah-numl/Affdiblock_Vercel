import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/affidblock"

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

/**
 * Global cache to maintain a single MongoDB connection across hot reloads in development.
 * Prevents exponential connection growth during API route usage.
 */
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
  if (cached.conn) {
    console.log("Using cached MongoDB connection")
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Allow up to 10 concurrent connections
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if server is unavailable
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    }

    console.log("Establishing new MongoDB connection")
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB connected")
        return mongoose
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error)
        cached.promise = null // Reset promise on failure to allow retries
        throw error
      })
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error)
    throw error
  }
}

export default dbConnect