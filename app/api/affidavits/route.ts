import { NextResponse } from "next/server"
import { createAffidavitRequest } from "@/lib/api/affidavits"
import { verifyToken } from "@/lib/api/auth"

// Create a new affidavit request
export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const tokenResult = verifyToken(token)

    if (!tokenResult.success) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { title, category, issuerId, parties, witnesses, description, declaration, ...additionalData } = body

    // Validate input
    if (!title || !category || !issuerId || !description || !declaration) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Create affidavit request
    const result = await createAffidavitRequest({
      title,
      category,
      issuerId,
      userId: tokenResult.decoded.id,
      dateRequested: new Date(),
      parties: parties || [],
      witnesses: witnesses || [],
      description,
      declaration,
      ...additionalData,
    })

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Create affidavit error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Get affidavits for the authenticated user
export async function GET(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
