import { NextResponse } from "next/server"
import { headers } from "next/headers"
import dbConnect from "@/lib/db"
import User from "@/lib/models/user"
import { uploadFile } from "@/lib/upload"
import { verifyToken } from "@/lib/api/auth"

export async function POST(request: Request) {
  try {
    // Get authorization header
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

    // Connect to database
    await dbConnect()

    // Find user
    const user = await User.findById(tokenResult.decoded.id)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Parse form data
    const formData = await request.formData()
    const avatar = formData.get("avatar") as File

    if (!avatar) {
      return NextResponse.json({ success: false, error: "Avatar file is required" }, { status: 400 })
    }

    // Validate file
    if (avatar.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Avatar must be less than 5MB" }, { status: 400 })
    }
    if (!avatar.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Avatar must be an image file" }, { status: 400 })
    }

    // Upload avatar
    const buffer = await avatar.arrayBuffer()
    const result = await uploadFile(Buffer.from(buffer), avatar.name, avatar.type, "avatars")

    // Update user with avatar URL
    user.avatar = result.url
    await user.save()

    // Return updated user
    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        idCardNumber: user.idCardNumber,
        idCardFrontUrl: user.idCardFrontUrl,
        idCardBackUrl: user.idCardBackUrl,
        address: user.address,
        bio: user.bio,
        walletAddress: user.walletAddress,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}