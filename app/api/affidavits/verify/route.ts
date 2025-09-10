import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { dbConnect } from "@/lib/db"
import Affidavit from "@/lib/models/affidavit"
import { generateAffidavitHash, createAffidavitDataForHash } from "@/lib/utils/hashGenerator"
import { ethers } from "ethers"

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
    inputs: [{ internalType: "string", name: "_affidavitId", type: "string" }],
    name: "getWitnesses",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
]

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "No affidavit ID provided" }, { status: 400 })
    }

    let affidavit;
    if (mongoose.Types.ObjectId.isValid(id)) {
      // If id is a valid MongoDB ObjectId, query by _id
      affidavit = await Affidavit.findById(id)
        .populate("issuerId", "_id name idCardNumber walletAddress")
        .populate("sellerId", "_id name idCardNumber walletAddress")
        .populate("buyerId", "_id name idCardNumber walletAddress")
        .populate("createdBy", "_id name idCardNumber walletAddress")
        .populate("witnesses.contactId", "_id name idCardNumber walletAddress")
    } else {
      // Otherwise, assume it's a displayId and query by displayId
      affidavit = await Affidavit.findOne({ displayId: id })
        .populate("issuerId", "_id name idCardNumber walletAddress")
        .populate("sellerId", "_id name idCardNumber walletAddress")
        .populate("buyerId", "_id name idCardNumber walletAddress")
        .populate("createdBy", "_id name idCardNumber walletAddress")
        .populate("witnesses.contactId", "_id name idCardNumber walletAddress")
    }

    if (!affidavit) {
      return NextResponse.json({ success: false, error: "Affidavit not found" }, { status: 404 })
    }

    const affidavitDataForHash = createAffidavitDataForHash(affidavit)

    const freshDataHash = generateAffidavitHash(affidavitDataForHash)
    console.log("[v0] Verification Input Data:", JSON.stringify(affidavitDataForHash, null, 2))
    console.log("[v0] Fresh Data Hash:", freshDataHash)
    console.log("[v0] Stored MongoDB Data Hash:", affidavit.dataHash)

    let blockchainData = null
    let originalData = null
    try {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_GANACHE_RPC_URL || "http://127.0.0.1:7545")
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xED7864989c1f88481C5Ac0242F263DC4CE2D427d"
      const contract = new ethers.Contract(contractAddress, AffidavitRegistryABI, provider)

      const bcData = await contract.getAffidavit(affidavit.displayId)
      const witnessIds = await contract.getWitnesses(affidavit.displayId)
      blockchainData = {
        affidavitId: bcData[0],
        title: bcData[1],
        category: bcData[2],
        description: bcData[3],
        declaration: bcData[4],
        issuerName: affidavit.issuerId.name, // Use populated issuerId.name instead of issuerId
        sellerId: bcData[6],
        buyerId: bcData[7],
        ipfsHashes: bcData[8],
        dataHash: bcData[9],
        timestamp: Number(bcData[10]),
        onBlockchain: bcData[11],
        witnessIds: witnessIds || [],
      }
      console.log("Blockchain Data:", blockchainData)
    } catch (error) {
      console.error("Error fetching blockchain data:", error)
      throw new Error("Failed to fetch blockchain data")
    }

    const isVerified = blockchainData.dataHash.toLowerCase() === affidavit.dataHash.toLowerCase()
    const isFreshHashValid = blockchainData.dataHash.toLowerCase() === freshDataHash.toLowerCase()
    const isTampered = !isVerified || !isFreshHashValid

    affidavit.isVerifiedOnBlockchain = isVerified && isFreshHashValid
    await affidavit.save()

    if (isTampered) {
      originalData = {
        affidavitId: blockchainData.affidavitId,
        title: blockchainData.title,
        category: blockchainData.category,
        description: blockchainData.description,
        declaration: blockchainData.declaration,
        issuerName: blockchainData.issuerName, // Use issuerName instead of issuerId
        sellerId: blockchainData.sellerId,
        buyerId: blockchainData.buyerId,
        witnessIds: blockchainData.witnessIds,
        ipfsHashes: blockchainData.ipfsHashes,
        dataHash: blockchainData.dataHash,
        timestamp: blockchainData.timestamp,
      }
    }

    return NextResponse.json({
      success: true,
      verified: isVerified && isFreshHashValid,
      isTampered,
      blockchainData,
      originalData,
    })
  } catch (error: any) {
    console.error("Error in POST /api/affidavits/verify:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}