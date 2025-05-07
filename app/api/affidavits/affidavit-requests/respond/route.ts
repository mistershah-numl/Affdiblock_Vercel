import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { dbConnect } from "@/lib/db"
import AffidavitRequest from "@/lib/models/affidavit-request"
import Affidavit from "@/lib/models/affidavit"
import User from "@/lib/models/user"
import { uploadFileToIPFSOnServer, uploadJSONToIPFS } from "@/lib/services/ipfs-service"
import path from "path"
import fs from "fs/promises"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { requestId, userId, activeRole, action, transactionHash, blockNumber, affidavitId } = await request.json()

    console.log("Received request:", {
      requestId,
      userId,
      activeRole,
      action,
      transactionHash: transactionHash ? "Present" : "Not present",
      blockNumber: blockNumber ? blockNumber : "Not present",
      affidavitId: affidavitId || "Not present",
    })

    // If this is a blockchain update request (second request after blockchain transaction)
    if (transactionHash && blockNumber && affidavitId) {
      console.log("Processing blockchain update for affidavit:", affidavitId)

      const affidavit = await Affidavit.findOne({ displayId: affidavitId })
      if (!affidavit) {
        console.error("Affidavit not found for update:", affidavitId)
        return NextResponse.json(
          { success: false, error: "Affidavit not found for blockchain update" },
          { status: 404 },
        )
      }

      // Update the affidavit with blockchain details
      affidavit.transactionHash = transactionHash
      affidavit.blockNumber = Number(blockNumber)
      affidavit.isVerifiedOnBlockchain = true
      affidavit.lastVerifiedAt = new Date()

      await affidavit.save()

      console.log("Successfully updated affidavit with blockchain details:", {
        displayId: affidavitId,
        transactionHash,
        blockNumber,
      })

      return NextResponse.json({
        success: true,
        message: "Affidavit updated with blockchain details successfully",
      })
    }

    // Regular request processing
    if (!requestId || !userId || !activeRole || !action) {
      return NextResponse.json({ success: false, error: "Missing or invalid required fields" }, { status: 400 })
    }

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action: must be 'accept' or 'reject'" },
        { status: 400 },
      )
    }

    if (!mongoose.Types.ObjectId.isValid(requestId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid ID format" }, { status: 400 })
    }

    const affidavitRequest = await AffidavitRequest.findById(requestId)
      .populate("issuerId", "_id name area idCardNumber walletAddress")
      .populate("sellerId", "_id name idCardNumber walletAddress")
      .populate("buyerId", "_id name idCardNumber walletAddress")
      .populate("createdBy", "_id name idCardNumber walletAddress")
      .populate("witnesses.contactId", "_id name idCardNumber")

    if (!affidavitRequest) {
      return NextResponse.json({ success: false, error: "Affidavit request not found" }, { status: 404 })
    }

    const isAccepted = action === "accept"
    let affidavitData = null

    if (activeRole === "Issuer" && affidavitRequest.issuerId._id.toString() === userId) {
      affidavitRequest.issuerAccepted = isAccepted

      if (isAccepted) {
        // Check wallet connectivity for all parties except witnesses
        const partiesToCheck = [
          { role: "issuer", id: affidavitRequest.issuerId._id.toString(), wallet: affidavitRequest.issuerId.walletAddress },
          ...(affidavitRequest.sellerId ? [{ role: "seller", id: affidavitRequest.sellerId._id.toString(), wallet: affidavitRequest.sellerId.walletAddress }] : []),
          ...(affidavitRequest.buyerId ? [{ role: "buyer", id: affidavitRequest.buyerId._id.toString(), wallet: affidavitRequest.buyerId.walletAddress }] : []),
        ]

        const missingWallets = partiesToCheck.filter(p => !p.wallet || p.wallet === "")
        if (missingWallets.length > 0) {
          return NextResponse.json(
            { success: false, error: `Missing wallet address for ${missingWallets.map(p => p.role).join(", ")}` },
            { status: 400 }
          )
        }

        const allPartiesAccepted =
          (affidavitRequest.sellerId ? affidavitRequest.sellerAccepted === true : true) &&
          (affidavitRequest.buyerId ? affidavitRequest.buyerAccepted === true : true) &&
          affidavitRequest.witnesses.every((w) => w.hasAccepted === true || w.hasAccepted === null)

        if (!allPartiesAccepted) {
          return NextResponse.json(
            { success: false, error: "All parties must accept before issuer can proceed" },
            { status: 400 },
          )
        }

        const displayId = await Affidavit.generateDisplayId()

        let ipfsHash = ""
        let documentsWithIPFS: any[] = []
        if (affidavitRequest.documents && affidavitRequest.documents.length > 0) {
          documentsWithIPFS = await Promise.all(
            affidavitRequest.documents.map(async (doc) => {
              if (doc.url) {
                const relativePath = doc.url.replace(/^.*public[/\\]/i, "").replace(/^[\\/]/, "")
                const absolutePath = path.join(process.cwd(), "public", relativePath)

                try {
                  await fs.access(absolutePath)
                } catch {
                  console.error(`File not found: ${absolutePath}`)
                  return { ...doc, ipfsHash: null }
                }

                const fileHash = await uploadFileToIPFSOnServer(relativePath)
                return { ...doc, ipfsHash: fileHash }
              }
              return { ...doc, ipfsHash: null }
            }),
          )

          const affidavitMetadata = {
            affidavitId: displayId,
            title: affidavitRequest.title,
            category: affidavitRequest.category,
            description: affidavitRequest.description,
            declaration: affidavitRequest.declaration,
            issuer: {
              id: affidavitRequest.issuerId._id.toString(),
              idCardNumber: affidavitRequest.issuerId.idCardNumber,
            },
            seller: affidavitRequest.sellerId
              ? { id: affidavitRequest.sellerId._id.toString(), idCardNumber: affidavitRequest.sellerId.idCardNumber }
              : null,
            buyer: affidavitRequest.buyerId
              ? { id: affidavitRequest.buyerId._id.toString(), idCardNumber: affidavitRequest.buyerId.idCardNumber }
              : null,
            witnesses: affidavitRequest.witnesses.map((w) => ({ id: w.contactId._id.toString(), idCardNumber: w.contactId.idCardNumber })),
            documents: documentsWithIPFS
              .filter((doc) => doc.ipfsHash)
              .map((doc) => ({
                name: doc.name,
                type: doc.type,
                ipfsHash: doc.ipfsHash,
              })),
            dateRequested: affidavitRequest.createdAt,
            dateIssued: new Date(),
          }

          ipfsHash = await uploadJSONToIPFS(affidavitMetadata, `Affidavit-${displayId}`)
        }

        const getIdCardNumber = async (userId: string) => {
          const user = await User.findById(userId).select("idCardNumber")
          if (!user || !user.idCardNumber) {
            throw new Error(`ID card number not found for user ${userId}`)
          }
          return user.idCardNumber
        }

        const issuerIdCard = await getIdCardNumber(affidavitRequest.issuerId._id.toString())
        const sellerIdCard = affidavitRequest.sellerId
          ? await getIdCardNumber(affidavitRequest.sellerId._id.toString())
          : undefined
        const buyerIdCard = affidavitRequest.buyerId
          ? await getIdCardNumber(affidavitRequest.buyerId._id.toString())
          : undefined

        affidavitRequest.status = "accepted"
        await affidavitRequest.save()

        // Create the affidavit in the database with empty blockchain details
        const newAffidavit = new Affidavit({
          displayId,
          title: affidavitRequest.title,
          category: affidavitRequest.category,
          description: affidavitRequest.description,
          declaration: affidavitRequest.declaration,
          issuerId: affidavitRequest.issuerId._id,
          issuerName: affidavitRequest.issuerId.name,
          issuerIdCardNumber: issuerIdCard,
          sellerId: affidavitRequest.sellerId?._id,
          sellerName: affidavitRequest.sellerId?.name,
          sellerIdCardNumber: sellerIdCard,
          buyerId: affidavitRequest.buyerId?._id,
          buyerName: affidavitRequest.buyerId?.name,
          buyerIdCardNumber: buyerIdCard,
          witnesses: affidavitRequest.witnesses.map((w) => ({
            contactId: w.contactId._id,
            name: w.contactId.name,
            idCardNumber: w.contactId.idCardNumber,
          })),
          documents: documentsWithIPFS,
          details: affidavitRequest.details || {},
          status: "Active",
          dateRequested: new Date(affidavitRequest.createdAt),
          dateIssued: new Date(),
          requestId: affidavitRequest._id,
          createdBy: affidavitRequest.createdBy._id,
          ipfsHash,
          transactionHash: "",
          blockNumber: 0,
          isVerifiedOnBlockchain: false,
        })

        const savedAffidavit = await newAffidavit.save()
        console.log("Created new affidavit:", {
          displayId,
          _id: savedAffidavit._id,
        })

        affidavitData = {
          affidavitId: displayId,
          title: affidavitRequest.title,
          category: affidavitRequest.category,
          description: affidavitRequest.description,
          declaration: affidavitRequest.declaration,
          issuerIdCard,
          sellerIdCard: sellerIdCard || "N/A",
          buyerIdCard: buyerIdCard || "N/A",
          witnessIds: affidavitRequest.witnesses.map((w) => w.contactId.idCardNumber),
          ipfsHash,
          documents: documentsWithIPFS,
        }
      } else {
        affidavitRequest.status = "rejected"
        await affidavitRequest.save()
      }
    } else if (!isAccepted) {
      affidavitRequest.status = "rejected"
      await affidavitRequest.save()
    } else {
      if (affidavitRequest.sellerId && affidavitRequest.sellerId._id.toString() === userId) {
        affidavitRequest.sellerAccepted = isAccepted
      } else if (affidavitRequest.buyerId && affidavitRequest.buyerId._id.toString() === userId) {
        affidavitRequest.buyerAccepted = isAccepted
      } else if (affidavitRequest.witnesses.some((w) => w.contactId._id.toString() === userId)) {
        affidavitRequest.witnesses.forEach((w) => {
          if (w.contactId._id.toString() === userId) w.hasAccepted = isAccepted
        })
        affidavitRequest.markModified("witnesses")
      } else {
        return NextResponse.json({ success: false, error: "User is not a party to this request" }, { status: 403 })
      }

      const anyPartyRejected =
        affidavitRequest.issuerAccepted === false ||
        (affidavitRequest.sellerId && affidavitRequest.sellerAccepted === false) ||
        (affidavitRequest.buyerId && affidavitRequest.buyerAccepted === false) ||
        affidavitRequest.witnesses.some((w) => w.hasAccepted === false)
      affidavitRequest.status = anyPartyRejected ? "rejected" : "pending"
      await affidavitRequest.save()
    }

    return NextResponse.json({
      success: true,
      message: `Affidavit request ${isAccepted ? "accepted" : "rejected"} successfully`,
      affidavitData,
    })
  } catch (error) {
    console.error("Error responding to affidavit request:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}