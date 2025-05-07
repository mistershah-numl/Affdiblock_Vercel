import { type NextRequest, NextResponse } from "next/server"
import {dbConnect} from "@/lib/db"
import Affidavit from "@/lib/models/affidavit"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Affidavit ID is required" }, { status: 400 })
    }

    // Find the affidavit in MongoDB
    const affidavit = await Affidavit.findOne({ displayId: id })
      .populate("issuerId", "name area idCardNumber walletAddress")
      .populate("sellerId", "name idCardNumber walletAddress")
      .populate("buyerId", "name idCardNumber walletAddress")
      .populate("witnesses.contactId", "name idCardNumber")
      .populate("createdBy", "name idCardNumber")

    if (!affidavit) {
      return NextResponse.json({ success: false, error: "Affidavit not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      affidavit,
    })
  } catch (error) {
    console.error("Error fetching affidavit:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}
