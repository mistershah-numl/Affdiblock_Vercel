import { type NextRequest, NextResponse } from "next/server"
import {dbConnect} from "@/lib/db"
import Affidavit from "@/lib/models/affidavit"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const role = searchParams.get("role") || "User"

    let query = {}

    // Filter based on user role and ID
    if (userId) {
      if (role === "Issuer") {
        query = { issuerId: userId }
      } else if (role === "User") {
        // For regular users, show affidavits where they are involved as buyer, seller, or witness
        query = {
          $or: [{ sellerId: userId }, { buyerId: userId }, { "witnesses.contactId": userId }, { createdBy: userId }],
        }
      }
      // For Admin role, no filtering needed - they see all
    }

    // Fetch from Affidavit collection
    let affidavits = await Affidavit.find(query)
      .populate("issuerId", "name area idCardNumber walletAddress")
      .populate("sellerId", "name idCardNumber walletAddress")
      .populate("buyerId", "name idCardNumber walletAddress")
      .populate("witnesses.contactId", "name idCardNumber")
      .populate("createdBy", "name idCardNumber")
      .sort({ createdAt: -1 })

    // Ensure all affidavits have a status field
    affidavits = affidavits.map((affidavit) => {
      const affidavitObj = affidavit.toObject()
      if (!affidavitObj.status) {
        console.warn(`Fixing missing status for affidavit ${affidavitObj._id}`)
        affidavitObj.status = "Active" // Default status
      }
      return affidavitObj
    })

    return NextResponse.json({
      success: true,
      affidavits,
    })
  } catch (error) {
    console.error("Error fetching affidavits:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}
