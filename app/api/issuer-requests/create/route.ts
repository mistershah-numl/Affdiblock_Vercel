import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { dbConnect } from "@/lib/db"
import User from "@/lib/models/user"
import IssuerRequest from "@/lib/models/issuer-requests"
import { uploadFile } from "@/lib/upload"
import { verifyToken } from "@/lib/api/auth"

export async function POST(request: NextRequest) {
  console.log("🚀 Starting issuer request creation...")

  try {
    // Debug: Check headers
    const headersList = await headers()
    const authorization = headersList.get("Authorization")
    console.log("📋 Authorization header:", authorization ? `Bearer ${authorization.slice(7, 20)}...` : "Missing")

    if (!authorization || !authorization.startsWith("Bearer ")) {
      console.log("❌ Missing or invalid authorization header")
      return NextResponse.json({ success: false, error: "Unauthorized: Missing or invalid token" }, { status: 401 })
    }

    // Debug: Verify token
    const token = authorization.split(" ")[1]
    console.log("🔐 Token length:", token.length)
    const tokenResult = verifyToken(token)
    console.log("🔓 Token verification result:", { success: tokenResult.success, hasDecoded: !!tokenResult.decoded })

    if (!tokenResult.success || !tokenResult.decoded) {
      console.log("❌ Token verification failed:", tokenResult.error)
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 })
    }

    console.log("👤 Decoded user ID:", tokenResult.decoded.id)

    // Debug: Database connection
    await dbConnect()
    console.log("💾 Database connected")

    // Debug: Find user
    const user = await User.findById(tokenResult.decoded.id)
    console.log("🔍 User found:", !!user, user ? `Name: ${user.name}` : "No user")

    if (!user) {
      console.log("❌ User not found in database")
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Debug: Parse form data
    console.log("📝 Parsing form data...")
    const formData = await request.formData()
    console.log("📋 Form data keys:", Array.from(formData.keys()))

    const organization = formData.get("organization") as string
    const city = formData.get("city") as string
    const designation = formData.get("designation") as string
    const dateOfJoining = formData.get("dateOfJoining") as string
    const license = formData.get("license") as File

    console.log("📊 Form data values:", {
      organization: organization ? `${organization.substring(0, 20)}...` : "Missing",
      city: city ? city : "Missing",
      designation: designation ? `${designation.substring(0, 20)}...` : "Missing",
      dateOfJoining: dateOfJoining ? dateOfJoining : "Missing",
      license: license ? `${license.name} (${license.size} bytes)` : "Missing",
    })

    // Debug: Field validation
    const missingFields = []
    if (!organization) missingFields.push("organization")
    if (!city) missingFields.push("city")
    if (!designation) missingFields.push("designation")
    if (!dateOfJoining) missingFields.push("dateOfJoining")
    if (!license) missingFields.push("license")

    if (missingFields.length > 0) {
      console.log("❌ Missing required fields:", missingFields)
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
          debug: { receivedFields: Array.from(formData.keys()) },
        },
        { status: 400 }
      )
    }

    // Validate dateOfJoining
    const parsedDate = new Date(dateOfJoining)
    if (isNaN(parsedDate.getTime())) {
      console.log("❌ Invalid date of joining:", dateOfJoining)
      return NextResponse.json({ success: false, error: "Invalid date of joining" }, { status: 400 })
    }

    // Check for existing pending request
    const existingRequest = await IssuerRequest.findOne({ userId: tokenResult.decoded.id, status: "Pending" })
    if (existingRequest) {
      console.log("❌ Existing pending request found:", existingRequest._id)
      return NextResponse.json(
        { success: false, error: "A pending issuer request already exists" },
        { status: 400 }
      )
    }

    // Debug: File validation
    console.log("📁 File details:", {
      name: license.name,
      size: license.size,
      type: license.type,
    })

    if (license.size > 10 * 1024 * 1024) {
      console.log("❌ File too large:", license.size)
      return NextResponse.json({ success: false, error: "License document must be less than 10MB" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(license.type)) {
      console.log("❌ Invalid file type:", license.type)
      return NextResponse.json(
        {
          success: false,
          error: `License document must be JPEG, PNG, GIF, WebP, or PDF. Received: ${license.type}`,
          debug: { allowedTypes },
        },
        { status: 400 }
      )
    }

    // Debug: File upload
    console.log("📤 Starting file upload...")
    let licenseUrl
    try {
      const licenseBuffer = await license.arrayBuffer()
      console.log("📦 File buffer size:", licenseBuffer.byteLength)

      const randomNo = Math.floor(1000 + Math.random() * 9000)
      const ext = license.name.split(".").pop() || "bin"
      const filename = `LICENSE_${user.idCardNumber}_${randomNo}.${ext}`
      console.log("📎 Generated filename:", filename)

      const uploadResult = await uploadFile(Buffer.from(licenseBuffer), filename, license.type, "licenses", user.idCardNumber)
      console.log("✅ Upload successful:", uploadResult.url ? "Has URL" : "No URL")

      licenseUrl = uploadResult.url.replace("ivory-implicit-sailfish-377.mypinata.cloud", "gateway.pinata.cloud")
      console.log("🔗 Final URL:", licenseUrl ? "Generated" : "Failed")
    } catch (error: any) {
      console.error("❌ Upload failed:", error.message)
      return NextResponse.json({ success: false, error: `Failed to upload license document: ${error.message}` }, { status: 500 })
    }

    // Debug: Create issuer request
    console.log("📝 Creating issuer request...")
    console.log("🔍 Schema fields being used:", Object.keys(IssuerRequest.schema.paths))
    const issuerRequest = new IssuerRequest({
      userId: tokenResult.decoded.id,
      licenseUrl,
      organization,
      city,
      designation,
      dateOfJoining: parsedDate,
      status: "Pending",
    })

    await issuerRequest.save()
    console.log("✅ Issuer request saved:", issuerRequest._id)

    return NextResponse.json({
      success: true,
      message: "Issuer request submitted successfully",
      data: {
        _id: issuerRequest._id,
        organization: issuerRequest.organization,
        city: issuerRequest.city,
        designation: issuerRequest.designation,
        dateOfJoining: issuerRequest.dateOfJoining,
        status: issuerRequest.status,
        createdAt: issuerRequest.createdAt,
      },
    })
  } catch (error: any) {
    console.error("💥 Critical error in issuer request creation:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        debug: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}