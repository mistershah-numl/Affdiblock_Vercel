import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/lib/models/user"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "AFFIDBLOCK"

export async function POST(request: Request) {
  try {
    await dbConnect()
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

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
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}