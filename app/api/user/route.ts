import { NextResponse } from "next/server"
import { headers } from "next/headers"
import dbConnect from "@/lib/db"
import User from "@/lib/models/user"
import { verifyToken } from "@/lib/api/auth"

export async function GET(request: Request) {
  try {
    // Get the Authorization header
    const headersList = await headers()
    const authorization = headersList.get("Authorization")

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authorization.split(" ")[1]
    const tokenResult = verifyToken(token)

    if (!tokenResult.success || !tokenResult.decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Connect to the database
    await dbConnect()

    // Fetch the user from the token to check their role
    const user = await User.findById(tokenResult.decoded.id).select("activeRole")
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Check if the user is an Admin
    if (user.activeRole !== "Admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // Fetch all users from MongoDB (excluding passwords)
    const users = await User.find().select("-password").lean()

    // Add affidavitsCount (mocked for now, assuming it's not in the schema)
    const usersWithAffidavits = users.map((user) => ({
      ...user,
      affidavitsCount: 0, // Replace with actual logic if you have an affidavits collection
    }))

    return NextResponse.json({ success: true, users: usersWithAffidavits })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}