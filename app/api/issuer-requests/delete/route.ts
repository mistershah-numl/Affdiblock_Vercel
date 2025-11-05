// filepath: d:\FYP\V62-AFFIDBLOCK\app\api\issuer-requests\delete\route.ts
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { dbConnect } from "@/lib/db"
import IssuerRequest from "@/lib/models/issuer-requests"
import User from "@/lib/models/user"
import jwt from "jsonwebtoken"

export async function POST(request: Request) {
  console.log("🚀 Starting issuer request deletion...")

  try {
    const headersList = await headers()
    const authorization = headersList.get("Authorization")
    console.log("📋 Authorization header:", authorization ? `Bearer ${authorization.slice(7, 20)}...` : "Missing")

    if (!authorization || !authorization.startsWith("Bearer ")) {
      console.log("❌ Missing or invalid authorization header")
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing or invalid token" },
        { status: 401 }
      )
    }

    const token = authorization.split(" ")[1]
    console.log("🔐 Token length:", token.length)
    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error("❌ JWT_SECRET is not configured")
      return NextResponse.json(
        { success: false, error: "Internal server error: JWT_SECRET missing" },
        { status: 500 }
      )
    }

    let decoded: { id: string; email: string; roles: string[]; activeRole: string } | null = null
    try {
      decoded = jwt.verify(token, secret) as { id: string; email: string; roles: string[]; activeRole: string }
      console.log("🔓 Decoded token:", {
        id: decoded.id,
        email: decoded.email,
        roles: decoded.roles,
        activeRole: decoded.activeRole
      })
    } catch (error: any) {
      console.error("❌ Error verifying JWT token:", { message: error.message, name: error.name })
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token" },
        { status: 401 }
      )
    }

    await dbConnect()
    console.log("💾 Database connected")

    const adminUser = await User.findById(decoded.id)
    console.log("🔍 Admin user details:", adminUser ? {
      _id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      roles: adminUser.roles,
      activeRole: adminUser.activeRole
    } : "No user found")

    if (!adminUser) {
      console.log("❌ Admin user not found")
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (adminUser.activeRole !== "Admin") {
      console.log("❌ User is not an admin", {
        activeRole: adminUser.activeRole,
        roles: adminUser.roles
      })
      return NextResponse.json(
        { success: false, error: "Only admins can perform this action" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { requestId } = body
    console.log("📝 Request ID:", requestId)

    if (!requestId) {
      console.log("❌ Request ID is required")
      return NextResponse.json(
        { success: false, error: "Request ID is required" },
        { status: 400 }
      )
    }

    const issuerRequest = await IssuerRequest.findById(requestId)
    console.log("🔍 Issuer request found:", issuerRequest ? {
      _id: issuerRequest._id,
      userId: issuerRequest.userId,
      status: issuerRequest.status
    } : "Not found")

    if (!issuerRequest) {
      console.log("❌ Issuer request not found")
      return NextResponse.json(
        { success: false, error: "Issuer request not found" },
        { status: 404 }
      )
    }

    // Delete the request
    console.log("🗑️ Deleting issuer request:", issuerRequest._id)
    await IssuerRequest.findByIdAndDelete(requestId)
    console.log("✅ Issuer request deleted")

    return NextResponse.json({
      success: true,
      message: "Issuer request deleted successfully",
    })
  } catch (error: any) {
    console.error("💥 Error deleting issuer request:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        debug: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    )
  }
}