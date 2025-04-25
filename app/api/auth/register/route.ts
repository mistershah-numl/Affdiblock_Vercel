import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/lib/models/user"
import { uploadFile } from "@/lib/upload"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const formData = await request.formData()
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const idCardNumber = formData.get("idCardNumber") as string
    const idCardFront = formData.get("idCardFront") as File
    const idCardBack = formData.get("idCardBack") as File

    if (!name || !email || !password || !idCardNumber || !idCardFront || !idCardBack) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 })
    }

    const existingIdCard = await User.findOne({ idCardNumber })
    if (existingIdCard) {
      return NextResponse.json({ success: false, error: "ID card number already registered" }, { status: 400 })
    }

    const frontBuffer = await idCardFront.arrayBuffer()
    const frontResult = await uploadFile(Buffer.from(frontBuffer), idCardFront.name, idCardFront.type, "id-cards")
    const backBuffer = await idCardBack.arrayBuffer()
    const backResult = await uploadFile(Buffer.from(backBuffer), idCardBack.name, idCardBack.type, "id-cards")

    const user = new User({
      name,
      email,
      password,
      idCardNumber,
      idCardFrontUrl: frontResult.url,
      idCardBackUrl: backResult.url,
      language: "english",
      timezone: "UTC+0",
      sessionTimeout: 30,
      status: "Active",
      roles: ["User"],
      activeRole: "User",
    })

    console.log("User object before saving:", user.toObject());

    await user.save()

    console.log("User saved to database:", await User.findOne({ email }));

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please log in.",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}