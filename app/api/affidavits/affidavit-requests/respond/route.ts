import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/db"
import AffidavitRequest from "@/lib/models/affidavit-request"
import User from "@/lib/models/user"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { requestId, userId, activeRole, action } = await request.json()

    // Validate required fields
    if (!requestId || !userId || !activeRole || !action) {
      return NextResponse.json({ success: false, error: "Missing or invalid required fields" }, { status: 400 })
    }

    // Validate action value
    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action: must be 'accept' or 'reject'" }, { status: 400 })
    }

    // Validate that requestId and userId are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return NextResponse.json({ success: false, error: "Invalid request ID format" }, { status: 400 })
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID format" }, { status: 400 })
    }

    // Fetch affidavit request
    const affidavitRequest = await AffidavitRequest.findById(requestId)
    if (!affidavitRequest) {
      return NextResponse.json({ success: false, error: "Affidavit request not found" }, { status: 404 })
    }

    const isAccepted = action === "accept"

    // Update based on activeRole
    if (activeRole === "Issuer" && affidavitRequest.issuerId.toString() === userId) {
      console.log("Updating issuer request:", { requestId, issuerAccepted: isAccepted, status: isAccepted ? "accepted" : "rejected" })
      const updateResult = await AffidavitRequest.updateOne(
        { _id: requestId },
        { issuerAccepted: isAccepted, status: isAccepted ? "accepted" : "rejected" }
      )
      console.log("Update Result:", updateResult)
    } else {
      // Logic for non-issuer roles (seller, buyer, witness)
      if (affidavitRequest.sellerId && affidavitRequest.sellerId.toString() === userId) {
        affidavitRequest.sellerAccepted = isAccepted
      }
      if (affidavitRequest.buyerId && affidavitRequest.buyerId.toString() === userId) {
        affidavitRequest.buyerAccepted = isAccepted
      }
      if (affidavitRequest.witnesses.some((w: any) => w.contactId.toString() === userId)) {
        affidavitRequest.witnesses.forEach((w: any) => {
          if (w.contactId.toString() === userId) {
            w.hasAccepted = isAccepted
          }
        })
        affidavitRequest.markModified("witnesses")
      }

      // Check if any party has rejected (issuer, seller, buyer, or any witness)
      const anyPartyRejected =
        (affidavitRequest.issuerAccepted === false) ||
        (affidavitRequest.sellerId && affidavitRequest.sellerAccepted === false) ||
        (affidavitRequest.buyerId && affidavitRequest.buyerAccepted === false) ||
        affidavitRequest.witnesses.some((w: any) => w.hasAccepted === false)

      if (anyPartyRejected) {
        affidavitRequest.status = "rejected"
      } else if (affidavitRequest.issuerAccepted === true) {
        const allPartiesAccepted =
          (affidavitRequest.sellerId ? affidavitRequest.sellerAccepted === true : true) &&
          (affidavitRequest.buyerId ? affidavitRequest.buyerAccepted === true : true) &&
          affidavitRequest.witnesses.every((w: any) => w.hasAccepted === true || w.hasAccepted === null)
        affidavitRequest.status = allPartiesAccepted ? "accepted" : "pending"
      } else {
        affidavitRequest.status = "pending"
      }

      await affidavitRequest.save()
    }

    return NextResponse.json({
      success: true,
      message: `Affidavit request ${isAccepted ? "accepted" : "rejected"} successfully`,
    })
  } catch (error: any) {
    console.error("Error responding to affidavit request:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}