import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/lib/models/user"
import { uploadFile } from "@/lib/upload"
import jwt from "jsonwebtoken"

// Secret key for JWT - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || "AFFIDBLOCK"

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect()

    // Parse form data (multipart/form-data)
    const formData = await request.formData()

    // Extract text fields
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const idCardNumber = formData.get("idCardNumber") as string

    // Extract files
    const idCardFront = formData.get("idCardFront") as File
    const idCardBack = formData.get("idCardBack") as File

    // Validate input
    if (!name || !email || !password || !idCardNumber || !idCardFront || !idCardBack) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 })
    }

    // Check if ID card number already exists
    const existingIdCard = await User.findOne({ idCardNumber })
    if (existingIdCard) {
      return NextResponse.json({ success: false, error: "ID card number already registered" }, { status: 400 })
    }

    // Upload ID card front image
    const frontBuffer = await idCardFront.arrayBuffer()
    const frontResult = await uploadFile(Buffer.from(frontBuffer), idCardFront.name, idCardFront.type, "id-cards")

    // Upload ID card back image
    const backBuffer = await idCardBack.arrayBuffer()
    const backResult = await uploadFile(Buffer.from(backBuffer), idCardBack.name, idCardBack.type, "id-cards")

    // Create new user
    const user = new User({
      name,
      email,
      password, // Will be hashed by pre-save hook
      idCardNumber,
      idCardFrontUrl: frontResult.url,
      idCardBackUrl: backResult.url,
    })

    // Save user to database
    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    )

    // Return success response
    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
