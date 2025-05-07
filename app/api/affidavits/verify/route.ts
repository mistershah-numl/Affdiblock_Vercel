import { type NextRequest, NextResponse } from "next/server"
import {dbConnect} from "@/lib/db"
import Affidavit from "@/lib/models/affidavit"
import { verifyAffidavitOnBlockchain } from "@/lib/services/blockchain-service"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const affidavitId = searchParams.get("id")

    if (!affidavitId) {
      return NextResponse.json({ success: false, error: "Affidavit ID is required" }, { status: 400 })
    }

    // Find the affidavit in MongoDB
    const affidavit = await Affidavit.findOne({ displayId: affidavitId })

    if (!affidavit) {
      return NextResponse.json({ success: false, error: "Affidavit not found" }, { status: 404 })
    }

    // If the affidavit doesn't have blockchain details, it can't be verified
    if (!affidavit.transactionHash) {
      return NextResponse.json({
        success: false,
        verified: false,
        reason: "Affidavit has not been stored on blockchain yet",
        affidavit,
      })
    }

    try {
      // Verify on blockchain
      const blockchainData = await verifyAffidavitOnBlockchain(affidavitId)

      // Compare blockchain data with MongoDB data
      const isAuthentic = compareAffidavitData(affidavit, blockchainData)

      // Update verification status in MongoDB
      await Affidavit.findByIdAndUpdate(affidavit._id, {
        isVerifiedOnBlockchain: isAuthentic,
        lastVerifiedAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        verified: isAuthentic,
        isAuthentic, // For backward compatibility
        affidavit,
        blockchainData,
      })
    } catch (error) {
      console.error("Error verifying on blockchain:", error)
      return NextResponse.json({
        success: false,
        verified: false,
        reason: "Error verifying on blockchain: " + error.message,
        affidavit,
      })
    }
  } catch (error) {
    console.error("Error verifying affidavit:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}

/**
 * Compare affidavit data from MongoDB with blockchain data
 */
function compareAffidavitData(mongoData, blockchainData) {
  // Basic checks
  if (!mongoData || !blockchainData) {
    return false
  }

  // Compare essential fields
  const basicChecks = [
    mongoData.displayId === blockchainData.affidavitId,
    mongoData.title === blockchainData.title,
    mongoData.category === blockchainData.category,
    mongoData.description === blockchainData.description,
    mongoData.declaration === blockchainData.declaration,
  ]

  // Check if any basic check fails
  return !basicChecks.some((check) => !check)
}
