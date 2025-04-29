import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import AffidavitRequest from "@/lib/models/affidavit-request"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Fetch affidavit requests where the user is involved (as creator, seller, buyer, or witness)
    const affidavitRequests = await AffidavitRequest.find({
      $or: [
        { createdBy: userId },
        { sellerId: userId },
        { buyerId: userId },
        { "witnesses.contactId": userId },
      ],
    })
      .populate("issuerId", "name")
      .populate("sellerId", "name idCardNumber")
      .populate("buyerId", "name idCardNumber")
      .populate("createdBy", "name idCardNumber")
      .populate("witnesses.contactId", "name idCardNumber")

    // If no affidavit requests are found, return an empty array with success
    return NextResponse.json({
      success: true,
      affidavitRequests: affidavitRequests || [],
    })
  } catch (error) {
    console.error("Error fetching affidavit requests:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}