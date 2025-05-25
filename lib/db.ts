import mongoose from "mongoose";

const MONGODB_URI: string = process.env.MONGODB_URI || "mongodb://localhost:27017/affidblock";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Define the shape of the cached connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  lastRefresh: number; // Timestamp of last refresh
}

// Extend the global object to include mongoose cache
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Initialize the cache
let cached: MongooseCache = global.mongoose || { conn: null, promise: null, lastRefresh: 0 };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function dbConnect(forceRefresh = false): Promise<typeof mongoose> {
  const now = Date.now();
  const refreshInterval = 300000; // Refresh every 5 minutes (adjust as needed)

  if (forceRefresh || !cached.conn || now - cached.lastRefresh > refreshInterval) {
    console.log("Forcing new MongoDB connection or refreshing due to timeout");
    cached.conn = null; // Invalidate existing connection
    cached.promise = null;
  }

  if (cached.conn) {
    console.log("Using cached MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    console.log("Establishing new MongoDB connection");
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("MongoDB connected successfully");
        cached.lastRefresh = now;
        return mongooseInstance;
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}