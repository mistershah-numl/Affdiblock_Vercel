import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { dbConnect } from "@/lib/db"
import IssuerRequest from "@/lib/models/issuer-requests"
import { verifyToken } from "@/lib/api/auth"

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const authorization = headersList.get("Authorization")

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized: Missing or invalid token" }, { status: 401 })
    }

    const token = authorization.split(" ")[1]
    const tokenResult = verifyToken(token)

    if (!tokenResult.success || !tokenResult.decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 })
    }

    await dbConnect()

    const existingRequest = await IssuerRequest.findOne({
      userId: tokenResult.decoded.id,
      status: "Pending",
    })

    if (existingRequest) {
      return NextResponse.json({
        success: true,
        hasPendingRequest: true,
        message: "A pending issuer request already exists",
        data: {
          _id: existingRequest._id,
          organization: existingRequest.organization,
          city: existingRequest.city,
          designation: existingRequest.designation,
          dateOfJoining: existingRequest.dateOfJoining,
          status: existingRequest.status,
          createdAt: existingRequest.createdAt,
        },
      })
    }

    return NextResponse.json({
      success: true,
      hasPendingRequest: false,
      message: "No pending issuer request found",
    })
  } catch (error: any) {
    console.error("Error checking issuer request:", {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}