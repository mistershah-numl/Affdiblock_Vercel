import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import AffidavitRequest from "@/lib/models/affidavit-request"
import User from "@/lib/models/user"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { requestId, userId, role, action } = await request.json()

    if (!requestId || !userId || !role || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const affidavitRequest = await AffidavitRequest.findById(requestId)
    if (!affidavitRequest) {
      return NextResponse.json({ success: false, error: "Affidavit request not found" }, { status: 404 })
    }

    // Fetch the user to check their active role
    const user = await User.findById(userId).select("activeRole")
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const isAccepted = action === "accept"

    // Handle acceptance/rejection based on role
    if (role === "issuer" && affidavitRequest.issuerId.toString() === userId) {
      if (user.activeRole !== "Issuer") {
        return NextResponse.json({ success: false, error: "Unauthorized: User must have Issuer role" }, { status: 403 })
      }
      affidavitRequest.issuerAccepted = isAccepted
    } else if (role === "seller" && affidavitRequest.sellerId?.toString() === userId) {
      affidavitRequest.sellerAccepted = isAccepted
    } else if (role === "buyer" && affidavitRequest.buyerId?.toString() === userId) {
      affidavitRequest.buyerAccepted = isAccepted
    } else if (role === "witness") {
      const witness = affidavitRequest.witnesses.find(
        (w: any) => w.contactId.toString() === userId
      )
      if (witness) {
        witness.hasAccepted = isAccepted
      } else {
        return NextResponse.json({ success: false, error: "Witness not found" }, { status: 404 })
      }
    } else {
      return NextResponse.json({ success: false, error: "Unauthorized action" }, { status: 403 })
    }

    // Update status logic:
    // - Status remains "pending" until the issuer acts.
    // - If issuer rejects, status becomes "rejected".
    // - If issuer accepts, status becomes "accepted" only if all other parties have accepted (or are not required to).
    if (affidavitRequest.issuerAccepted === false) {
      affidavitRequest.status = "rejected"
    } else if (affidavitRequest.issuerAccepted === true) {
      const allOtherPartiesAccepted =
        (affidavitRequest.sellerId ? affidavitRequest.sellerAccepted : true) &&
        (affidavitRequest.buyerId ? affidavitRequest.buyerAccepted : true) &&
        affidavitRequest.witnesses.every((w: any) => w.hasAccepted || w.hasAccepted === undefined)

      if (allOtherPartiesAccepted) {
        affidavitRequest.status = "accepted"
        // At this point, a smart contract would be triggered to add details to the blockchain
        // and store the hash, block number, etc., in the allaffidavits table.
        // This will be implemented later as per your instructions.
      } else {
        affidavitRequest.status = "pending"
      }
    } else {
      affidavitRequest.status = "pending"
    }

    await affidavitRequest.save()

    return NextResponse.json({
      success: true,
      message: `Affidavit request ${isAccepted ? "accepted" : "rejected"} successfully`,
    })
  } catch (error) {
    console.error("Error responding to affidavit request:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}