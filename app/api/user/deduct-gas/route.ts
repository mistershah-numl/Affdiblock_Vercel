import { NextResponse } from "next/server"
import { headers } from "next/headers"
import {dbConnect} from "@/lib/db"
import User from "@/lib/models/user"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "AFFIDBLOCK"

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const authorization = headersList.get("Authorization")

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authorization.split(" ")[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string }

    const body = await request.json()
    const { userIds, amount } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !amount) {
      return NextResponse.json({ success: false, error: "Missing or invalid required fields" }, { status: 400 })
    }

    await dbConnect()

    const updateResult = await User.updateMany(
      { _id: { $in: userIds } },
      { $inc: { balance: -parseFloat(amount) } }
    )

    if (updateResult.modifiedCount !== userIds.length) {
      return NextResponse.json({ success: false, error: "Failed to deduct gas fees for some users" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Gas fees deducted successfully",
    })
  } catch (error) {
    console.error("Error deducting gas fees:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}