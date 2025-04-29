import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import AffidavitRequest from "@/lib/models/affidavit-request"

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

    const isAccepted = action === "accept"

    if (role === "seller" && affidavitRequest.sellerId.toString() === userId) {
      affidavitRequest.sellerAccepted = isAccepted
    } else if (role === "buyer" && affidavitRequest.buyerId.toString() === userId) {
      affidavitRequest.buyerAccepted = isAccepted
    } else if (role === "witness") {
      const witness = affidavitRequest.witnesses.find(
        (w: any) => w.contactId.toString() === userId
      )
      if (witness) {
        witness.hasAccepted = isAccepted
      }
    } else {
      return NextResponse.json({ success: false, error: "Unauthorized action" }, { status: 403 })
    }

    // Check if all parties have accepted
    const allAccepted =
      (affidavitRequest.sellerId ? affidavitRequest.sellerAccepted : true) &&
      (affidavitRequest.buyerId ? affidavitRequest.buyerAccepted : true) &&
      affidavitRequest.witnesses.every((w: any) => w.hasAccepted)

    if (allAccepted) {
      affidavitRequest.status = "approved"
    } else if (!isAccepted) {
      affidavitRequest.status = "rejected"
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