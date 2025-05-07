import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/db"
import Affidavit from "@/lib/models/affidavit"
import { verifyToken } from "@/lib/api/auth"

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { displayId, transactionHash, blockNumber } = body

    console.log("Received request body in /api/affidavits/update:", { displayId, transactionHash, blockNumber })

    if (!displayId || !transactionHash || blockNumber === undefined) {
      console.error("Missing required fields:", { displayId, transactionHash, blockNumber })
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const headersList = request.headers
    const authorization = headersList.get("Authorization")

    if (!authorization || !authorization.startsWith("Bearer ")) {
      console.error("Authorization header missing or invalid")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authorization.split(" ")[1]
    const tokenResult = verifyToken(token)

    if (!tokenResult.success || !tokenResult.decoded) {
      console.error("Invalid token:", tokenResult.error)
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const affidavit = await Affidavit.findOne({ displayId })
    if (!affidavit) {
      console.error("Affidavit not found for displayId:", displayId)
      return NextResponse.json({ success: false, error: "Affidavit not found" }, { status: 404 })
    }

    affidavit.transactionHash = transactionHash
    affidavit.blockNumber = Number(blockNumber)
    affidavit.isVerifiedOnBlockchain = true
    affidavit.lastVerifiedAt = new Date()

    await affidavit.save()

    console.log("Affidavit updated successfully:", { displayId, transactionHash, blockNumber: affidavit.blockNumber })

    return NextResponse.json({
      success: true,
      message: "Affidavit updated with blockchain details successfully",
    })
  } catch (error) {
    console.error("Error updating affidavit:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}