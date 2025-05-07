import { type NextRequest, NextResponse } from "next/server"
import {dbConnect} from "@/lib/db"
import Affidavit from "@/lib/models/affidavit"
import AllAffidavit from "@/lib/models/affidavit"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { affidavitId, blockchainHash, blockchainBlockNumber } = await request.json()

    if (!affidavitId || !blockchainHash || !blockchainBlockNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: affidavitId, blockchainHash, blockchainBlockNumber",
        },
        { status: 400 },
      )
    }

    // Update in both collections for consistency
    const updatePromises = []

    // Update in Affidavit collection
    updatePromises.push(
      Affidavit.findOneAndUpdate(
        { displayId: affidavitId },
        {
          transactionHash: blockchainHash,
          blockNumber: blockchainBlockNumber,
          isVerifiedOnBlockchain: true,
          lastVerifiedAt: new Date(),
        },
      ),
    )

    // Update in AllAffidavit collection
    updatePromises.push(
      AllAffidavit.findOneAndUpdate(
        { affidavitId },
        {
          blockchainHash,
          blockchainBlockNumber,
          status: "Active", // Ensure status is set to Active after blockchain confirmation
        },
      ),
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: "Blockchain details updated successfully",
    })
  } catch (error) {
    console.error("Error updating blockchain details:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}
