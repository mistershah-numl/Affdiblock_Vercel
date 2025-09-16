import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { dbConnect } from "@/lib/db"
import User from "@/lib/models/user"
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

    const adminUser = await User.findById(tokenResult.decoded.id)
    if (!adminUser || adminUser.activeRole !== "Admin") {
      return NextResponse.json({ success: false, error: "Only admins can perform this action" }, { status: 403 })
    }

    const issuerRequests = await IssuerRequest.find()
      .populate({
        path: "userId",
        select: "name email idCardNumber",
      })
      .sort({ createdAt: -1 })

    const formattedRequests = issuerRequests.map((request) => ({
      _id: request._id,
      user: {
        _id: request.userId._id,
        name: request.userId.name,
        email: request.userId.email,
        idCardNumber: request.userId.idCardNumber,
      },
      licenseUrl: request.licenseUrl,
      organization: request.organization,
      city: request.city,
      designation: request.designation,
      dateOfJoining: request.dateOfJoining,
      status: request.status,
      remarks: request.remarks,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: formattedRequests,
    })
  } catch (error: any) {
    console.error("Error fetching issuer requests:", {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}