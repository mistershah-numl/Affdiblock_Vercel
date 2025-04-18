import { NextResponse } from "next/server"
import { headers } from "next/headers"
import dbConnect from "@/lib/db"
import User from "@/lib/models/user"
import { verifyToken } from "@/lib/api/auth"

// GET user profile
export async function GET(request: Request) {
  try {
    // Get authorization header
    const headersList = headers()
    const authorization = headersList.get("Authorization")

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authorization.split(" ")[1]
    const tokenResult = verifyToken(token)

    if (!tokenResult.success) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Connect to database
    await dbConnect()

    // Find user by ID
    const user = await User.findById(tokenResult.decoded.id).select("-password")

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Return user data
    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// PUT update user profile
export async function PUT(request: Request) {
  try {
    // Get authorization header
    const headersList = headers()
    const authorization = headersList.get("Authorization")

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authorization.split(" ")[1]
    const tokenResult = verifyToken(token)

    if (!tokenResult.success) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { name, phone, address, bio } = body

    // Connect to database
    await dbConnect()

    // Find user by ID
    const user = await User.findById(tokenResult.decoded.id)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Update user data
    if (name) user.name = name
    if (phone) user.phone = phone
    if (address) user.address = address
    if (bio) user.bio = bio

    // Save updated user
    await user.save()

    // Return updated user data
    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        role: user.role,
        status: user.status,
      },
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
