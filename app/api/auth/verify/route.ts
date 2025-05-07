import { NextResponse } from "next/server"
import { headers } from "next/headers"
import {dbConnect} from "@/lib/db"
import User from "@/lib/models/user"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "AFFIDBLOCK"

export async function GET(request: Request) {
  try {
    // Await headers() to resolve the Promise
    const headersList = await headers()
    const authorization = headersList.get("Authorization")

    console.log("Verify request headers:", { authorization })

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authorization.split(" ")[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string }

    await dbConnect()
    const user = await User.findById(decoded.id).lean() // Use lean() for faster queries

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
  }
}