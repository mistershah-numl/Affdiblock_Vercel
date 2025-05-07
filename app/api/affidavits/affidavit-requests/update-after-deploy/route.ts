import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { dbConnect } from "@/lib/db"
import AffidavitRequest from "@/lib/models/affidavit-request"
import Affidavit from "@/lib/models/affidavit"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { requestId, affidavitData, transactionHash, blockNumber } = await request.json()

    // Validate required fields
    if (!requestId || !affidavitData || !transactionHash || !blockNumber) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate that requestId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return NextResponse.json({ success: false, error: "Invalid request ID format" }, { status: 400 })
    }

    // Fetch affidavit request
    const affidavitRequest = await AffidavitRequest.findById(requestId)
      .populate("issuerId", "_id name area idCardNumber walletAddress")
      .populate("sellerId", "_id name idCardNumber walletAddress")
      .populate("buyerId", "_id name idCardNumber walletAddress")
      .populate("createdBy", "_id name idCardNumber")
      .populate("witnesses.contactId", "_id name idCardNumber")

    if (!affidavitRequest) {
      return NextResponse.json({ success: false, error: "Affidavit request not found" }, { status: 404 })
    }

    // Update affidavit request status
    affidavitRequest.status = "accepted"
    await affidavitRequest.save()

    // Create affidavit in MongoDB
    const newAffidavit = new Affidavit({
      displayId: affidavitData.affidavitId,
      title: affidavitData.title,
      category: affidavitData.category,
      description: affidavitData.description,
      declaration: affidavitData.declaration,
      issuerId: affidavitRequest.issuerId._id,
      issuerName: affidavitRequest.issuerId.name,
      issuerWalletAddress: affidavitRequest.issuerId.walletAddress || "0x0000000000000000000000000000000000000000",
      sellerId: affidavitRequest.sellerId?._id,
      sellerName: affidavitRequest.sellerId?.name,
      sellerWalletAddress: affidavitRequest.sellerId?.walletAddress,
      buyerId: affidavitRequest.buyerId?._id,
      buyerName: affidavitRequest.buyerId?.name,
      buyerWalletAddress: affidavitRequest.buyerId?.walletAddress,
      witnesses: affidavitRequest.witnesses.map((w) => ({
        contactId: w.contactId._id,
        name: w.contactId.name,
        idCardNumber: w.contactId.idCardNumber,
      })),
      documents: affidavitData.documents
        .filter((doc: any) => doc.ipfsHash)
        .map((doc: any) => ({
          url: doc.url,
          name: doc.name,
          type: doc.type,
          ipfsHash: doc.ipfsHash,
        })),
      details: affidavitData.details || {},
      status: "accepted",
      dateRequested: new Date(affidavitData.dateRequested),
      dateIssued: new Date(affidavitData.dateIssued),
      requestId: affidavitRequest._id,
      createdBy: affidavitRequest.createdBy._id,
      ipfsHash: affidavitData.ipfsHash,
      transactionHash,
      blockNumber,
    })

    await newAffidavit.save()
    console.log(`Affidavit created with ID: ${affidavitData.affidavitId}`)

    return NextResponse.json({
      success: true,
      message: "Affidavit request updated and affidavit created successfully",
    })
  } catch (error) {
    console.error("Error updating affidavit request after deployment:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}