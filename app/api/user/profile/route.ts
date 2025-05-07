import { NextResponse } from "next/server"
import { headers } from "next/headers"
import {dbConnect} from "@/lib/db"
import User from "@/lib/models/user"
import { verifyToken } from "@/lib/api/auth"

// GET user profile
export async function GET(request: Request) {
  try {
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

    await dbConnect()

    const user = await User.findById(tokenResult.decoded.id).select("-password")

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        idCardNumber: user.idCardNumber,
        idCardFrontUrl: user.idCardFrontUrl,
        idCardBackUrl: user.idCardBackUrl,
        address: user.address,
        bio: user.bio,
        walletAddress: user.walletAddress,
        roles: user.roles,
        activeRole: user.activeRole,
        status: user.status,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// PUT update user profile
export async function PUT(request: Request) {
  try {
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

    const body = await request.json()
    console.log("PUT /api/user/profile request body:", body)
    const { name, phone, address, bio, activeRole, avatar } = body

    await dbConnect()

    const user = await User.findById(tokenResult.decoded.id)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Validate activeRole if provided
    if (activeRole) {
      if (!user.roles.includes(activeRole)) {
        return NextResponse.json(
          { success: false, error: "Invalid role selected" },
          { status: 400 }
        )
      }
      user.activeRole = activeRole
    }

    if (name) user.name = name
    if (phone) user.phone = phone
    if (address) user.address = address
    if (bio) user.bio = bio
    if (avatar) user.avatar = avatar

    await user.save()

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        idCardNumber: user.idCardNumber,
        idCardFrontUrl: user.idCardFrontUrl,
        idCardBackUrl: user.idCardBackUrl,
        address: user.address,
        bio: user.bio,
        walletAddress: user.walletAddress,
        roles: user.roles,
        activeRole: user.activeRole,
        status: user.status,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}