import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { dbConnect } from "@/lib/db"
import AffidavitRequest from "@/lib/models/affidavit-request"
import Affidavit from "@/lib/models/affidavit"
import User from "@/lib/models/user"
import { uploadFileToIPFS } from "@/lib/services/ipfs-service"
import { generateAffidavitHash, createAffidavitDataForHash } from "@/lib/utils/hashGenerator"
import { ethers } from "ethers"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { requestId, userId, activeRole, action, transactionHash, blockNumber, displayId, dataHash } =
      await request.json()

    console.log("Received request:", {
      requestId,
      userId,
      activeRole,
      action,
      transactionHash,
      blockNumber,
      displayId,
      dataHash,
    })

    // Validate required fields
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

    // Fetch affidavit request with populated fields
    const affidavitRequest = await AffidavitRequest.findById(requestId)
      .populate("issuerId", "_id name idCardNumber walletAddress")
      .populate("sellerId", "_id name idCardNumber walletAddress")
      .populate("buyerId", "_id name idCardNumber walletAddress")
      .populate("createdBy", "_id name idCardNumber walletAddress")
      .populate("witnesses.contactId", "_id name idCardNumber walletAddress")

    if (!affidavitRequest) {
      return NextResponse.json({ success: false, error: "Affidavit request not found" }, { status: 404 })
    }

    const isAccepted = action === "accept"

    // Handle issuer acceptance with blockchain deployment
    if (activeRole === "Issuer" && affidavitRequest.issuerId._id.toString() === userId && isAccepted) {
      // Check if all non-issuer parties have accepted
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

      // Validate blockchain-related fields
      if (!transactionHash || blockNumber === undefined || !displayId || !dataHash) {
        return NextResponse.json(
          {
            success: false,
            error: "Transaction hash, block number, displayId, and dataHash are required for issuer acceptance",
          },
          { status: 400 },
        )
      }

      // Verify issuer's wallet
      const issuerUser = await User.findById(userId).select("walletAddress")
      if (!issuerUser || !issuerUser.walletAddress) {
        return NextResponse.json(
          { success: false, error: "Issuer wallet address is not set. Please connect your blockchain wallet." },
          { status: 400 },
        )
      }

      // Initialize blockchain provider and contract
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_GANACHE_RPC_URL || "http://127.0.0.1:7545")
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xED7864989c1f88481C5Ac0242F263DC4CE2D427d"

      // Verify contract deployment
      const code = await provider.getCode(contractAddress)
      if (code === "0x") {
        console.error(`No contract deployed at address ${contractAddress}`)
        return NextResponse.json(
          { success: false, error: `No contract deployed at address ${contractAddress}` },
          { status: 500 },
        )
      }

      // Use AffidavitRegistryABI directly as it is the ABI array
      const contract = new ethers.Contract(contractAddress, AffidavitRegistryABI, provider)

      // Verify affidavit on blockchain
      try {
        const bcData = await contract.getAffidavit(displayId)
        if (!bcData.onBlockchain) {
          console.error(`Affidavit ${displayId} not found on blockchain`)
          return NextResponse.json(
            { success: false, error: `Affidavit ${displayId} not found on blockchain` },
            { status: 400 },
          )
        }

        const affidavitDataForHash = createAffidavitDataForHash(affidavitRequest, displayId)

        console.log("[v0] API affidavitDataForHash:", JSON.stringify(affidavitDataForHash, null, 2))

        const calculatedHash = generateAffidavitHash(affidavitDataForHash)
        console.log("[v0] Calculated Hash:", calculatedHash)
        console.log("[v0] Received Data Hash:", dataHash)

        if (calculatedHash.toLowerCase() !== dataHash.toLowerCase()) {
          console.error("[v0] Data hash mismatch:", { calculatedHash, blockchainHash: dataHash })
          return NextResponse.json({ success: false, error: "Data hash verification failed" }, { status: 400 })
        }

        // Verify transaction
        const receipt = await provider.getTransactionReceipt(transactionHash)
        if (!receipt || receipt.blockNumber !== blockNumber) {
          console.error("Transaction verification failed:", { transactionHash, blockNumber })
          return NextResponse.json({ success: false, error: "Transaction verification failed" }, { status: 400 })
        }
      } catch (error: any) {
        console.error("Blockchain verification error:", error)
        return NextResponse.json(
          { success: false, error: `Failed to verify affidavit on blockchain: ${error.message}` },
          { status: 500 },
        )
      }

      // Upload documents to IPFS if not already uploaded
      const ipfsHashes = []
      for (const doc of affidavitRequest.documents) {
        if (!doc.ipfsHash) {
          try {
            const response = await fetch(doc.url)
            if (!response.ok) {
              throw new Error(`Failed to fetch document ${doc.name}: HTTP ${response.status}`)
            }
            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const file = new File([buffer], doc.name, { type: doc.type })
            const ipfsHash = await uploadFileToIPFS(file)
            ipfsHashes.push(ipfsHash)
            doc.ipfsHash = ipfsHash
          } catch (error: any) {
            console.error(`Error uploading document ${doc.name} to IPFS:`, error)
            return NextResponse.json(
              { success: false, error: `Failed to upload document ${doc.name} to IPFS: ${error.message}` },
              { status: 500 },
            )
          }
        } else {
          ipfsHashes.push(doc.ipfsHash)
        }
      }

      // Create and save new affidavit
      const newAffidavit = new Affidavit({
        displayId,
        title: affidavitRequest.title,
        category: affidavitRequest.category,
        description: affidavitRequest.description,
        declaration: affidavitRequest.declaration,
        issuerId: affidavitRequest.issuerId._id,
        issuerName: affidavitRequest.issuerId.name,
        issuerIdCardNumber: affidavitRequest.issuerId.idCardNumber,
        issuerWalletAddress: affidavitRequest.issuerId.walletAddress,
        sellerId: affidavitRequest.sellerId?._id,
        sellerName: affidavitRequest.sellerId?.name,
        sellerIdCardNumber: affidavitRequest.sellerId?.idCardNumber,
        sellerWalletAddress: affidavitRequest.sellerId?.walletAddress,
        buyerId: affidavitRequest.buyerId?._id,
        buyerName: affidavitRequest.buyerId?.name,
        buyerIdCardNumber: affidavitRequest.buyerId?.idCardNumber,
        buyerWalletAddress: affidavitRequest.buyerId?.walletAddress,
        witnesses: affidavitRequest.witnesses.map((w) => ({
          contactId: w.contactId._id,
          name: w.contactId.name,
          idCardNumber: w.contactId.idCardNumber,
          walletAddress: w.contactId.walletAddress,
          hasAccepted: w.hasAccepted,
        })),
        documents: affidavitRequest.documents,
        dataHash,
        transactionHash,
        blockNumber,
        isVerifiedOnBlockchain: true,
        status: "Active",
        dateRequested: new Date(affidavitRequest.createdAt),
        dateIssued: new Date(),
        requestId: affidavitRequest._id,
        createdBy: affidavitRequest.createdBy._id,
      })

      await newAffidavit.save()

      // Update affidavit request status
      affidavitRequest.status = "accepted"
      affidavitRequest.issuerAccepted = true
      await affidavitRequest.save()

      console.log("Affidavit created and saved:", newAffidavit._id)

      return NextResponse.json({
        success: true,
        message: "Affidavit accepted and deployed to blockchain successfully",
        affidavit: newAffidavit,
      })
    } else if (!isAccepted) {
      // Handle rejection
      affidavitRequest.status = "rejected"
      if (activeRole === "Issuer" && affidavitRequest.issuerId._id.toString() === userId) {
        affidavitRequest.issuerAccepted = false
      } else if (affidavitRequest.sellerId && affidavitRequest.sellerId._id.toString() === userId) {
        affidavitRequest.sellerAccepted = false
      } else if (affidavitRequest.buyerId && affidavitRequest.buyerId._id.toString() === userId) {
        affidavitRequest.buyerAccepted = false
      } else if (affidavitRequest.witnesses.some((w) => w.contactId._id.toString() === userId)) {
        affidavitRequest.witnesses.forEach((w) => {
          if (w.contactId._id.toString() === userId) w.hasAccepted = false
        })
        affidavitRequest.markModified("witnesses")
      } else {
        return NextResponse.json({ success: false, error: "User is not a party to this request" }, { status: 403 })
      }
      await affidavitRequest.save()
      return NextResponse.json({
        success: true,
        message: "Affidavit request rejected successfully",
      })
    } else {
      // Handle non-issuer acceptance
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

      // Update status based on party responses
      const anyPartyRejected =
        affidavitRequest.issuerAccepted === false ||
        (affidavitRequest.sellerId && affidavitRequest.sellerAccepted === false) ||
        (affidavitRequest.buyerId && affidavitRequest.buyerAccepted === false) ||
        affidavitRequest.witnesses.some((w) => w.hasAccepted === false)

      if (anyPartyRejected) {
        affidavitRequest.status = "rejected"
      } else {
        affidavitRequest.status = "pending"
      }

      await affidavitRequest.save()
      return NextResponse.json({
        success: true,
        message: `Affidavit request ${isAccepted ? "accepted" : "rejected"} by ${activeRole}`,
      })
    }
  } catch (error: any) {
    console.error("Error in POST /api/affidavits/affidavit-requests/respond:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}

// Define ABI as an array directly
const AffidavitRegistryABI = [
  {
    inputs: [
      { internalType: "string", name: "_affidavitId", type: "string" },
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "string", name: "_category", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
      { internalType: "string", name: "_declaration", type: "string" },
      { internalType: "string", name: "_issuerId", type: "string" },
      { internalType: "string", name: "_sellerId", type: "string" },
      { internalType: "string", name: "_buyerId", type: "string" },
      { internalType: "string[]", name: "_witnessIds", type: "string[]" },
      { internalType: "string[]", name: "_ipfsHashes", type: "string[]" },
      { internalType: "string", name: "_dataHash", type: "string" },
    ],
    name: "createAffidavit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAffidavitCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_affidavitId", type: "string" }],
    name: "getAffidavit",
    outputs: [
      { internalType: "string", name: "affidavitId", type: "string" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "category", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "string", name: "declaration", type: "string" },
      { internalType: "string", name: "issuerId", type: "string" },
      { internalType: "string", name: "sellerId", type: "string" },
      { internalType: "string", name: "buyerId", type: "string" },
      { internalType: "string[]", name: "ipfsHashes", type: "string[]" },
      { internalType: "string", name: "dataHash", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "onBlockchain", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_userId", type: "string" }],
    name: "getUserAffidavits",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_affidavitId", type: "string" }],
    name: "getWitnesses",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_affidavitId", type: "string" }],
    name: "revokeAffidavit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_affidavitId", type: "string" }],
    name: "verifyAffidavit",
    outputs: [
      { internalType: "bool", name: "exists", type: "bool" },
      { internalType: "bool", name: "onBlockchain", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
]
