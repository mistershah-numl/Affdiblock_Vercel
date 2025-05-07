import { NextResponse } from "next/server"
import {dbConnect} from "@/lib/db"
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
        roles: user.roles,
        activeRole: user.activeRole,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    const responseData = {
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        idCardNumber: user.idCardNumber,
        address: user.address,
        bio: user.bio,
        walletAddress: user.walletAddress,
        walletConnectedAt: user.walletConnectedAt,
        network: user.network,
        language: user.language,
        timezone: user.timezone,
        sessionTimeout: user.sessionTimeout,
        avatar: user.avatar,
        idCardFrontUrl: user.idCardFrontUrl,
        idCardBackUrl: user.idCardBackUrl,
        status: user.status,
        roles: user.roles,
        activeRole: user.activeRole,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };

    console.log("Login API response:", responseData);

    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}