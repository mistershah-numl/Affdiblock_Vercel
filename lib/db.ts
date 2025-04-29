import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/affidblock"

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

// Define the shape of the cached connection
interface MongooseCache {
  conn: mongoose.Mongoose | null
  promise: Promise<mongoose.Mongoose> | null
}

// Extend the global object to include mongoose
declare global {
  namespace NodeJS {
    interface Global {
      mongoose: MongooseCache
    }
  }
}

// Initialize the cache
let cached: MongooseCache = (global as any).mongoose || { conn: null, promise: null }

if (!(global as any).mongoose) {
  (global as any).mongoose = cached
}

async function dbConnect(): Promise<mongoose.Mongoose> {
  if (cached.conn) {
    console.log("Using cached MongoDB connection")
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    console.log("Establishing new MongoDB connection")
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("MongoDB connected")
        return mongooseInstance
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error)
        cached.promise = null
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