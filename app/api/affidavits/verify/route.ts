import { type NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import Affidavit from "@/lib/models/affidavit";
import { generateAffidavitHash } from "@/lib/utils/hashGenerator";
import { ethers } from "ethers";

const AffidavitRegistryABI = [
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
      { internalType: "string[]", name: "witnessIds", type: "string[]" }, // Added
    ],
    stateMutability: "view",
    type: "function",
  },
];

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { id } = await request.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid affidavit ID" }, { status: 400 });
    }

    const affidavit = await Affidavit.findById(id)
      .populate("issuerId", "_id name idCardNumber walletAddress")
      .populate("sellerId", "_id name idCardNumber walletAddress")
      .populate("buyerId", "_id name idCardNumber walletAddress")
      .populate("createdBy", "_id name idCardNumber walletAddress")
      .populate("witnesses.contactId", "_id name idCardNumber walletAddress");

    if (!affidavit) {
      return NextResponse.json({ success: false, error: "Affidavit not found" }, { status: 404 });
    }

    // Prepare data for fresh hash
    const affidavitDataForHash = {
      displayId: affidavit.displayId || "",
      title: affidavit.title || "",
      category: affidavit.category || "",
      description: affidavit.description || "",
      declaration: affidavit.declaration || "",
      issuerId: affidavit.issuerId?._id.toString() || "",
      issuerName: affidavit.issuerId?.name || "",
      issuerIdCardNumber: affidavit.issuerId?.idCardNumber || "",
      issuerWalletAddress: affidavit.issuerId?.walletAddress || "",
      sellerId: affidavit.sellerId?._id.toString() || "",
      sellerName: affidavit.sellerId?.name || "",
      sellerIdCardNumber: affidavit.sellerId?.idCardNumber || "",
      sellerWalletAddress: affidavit.sellerId?.walletAddress || "",
      buyerId: affidavit.buyerId?._id.toString() || "",
      buyerName: affidavit.buyerId?.name || "",
      buyerIdCardNumber: affidavit.buyerId?.idCardNumber || "",
      buyerWalletAddress: affidavit.buyerId?.walletAddress || "",
      witnesses: (affidavit.witnesses || []).map((w) => ({
        contactId: w.contactId?._id.toString() || "",
        name: w.contactId?.name || "",
        idCardNumber: w.contactId?.idCardNumber || "",
        walletAddress: w.contactId?.walletAddress || "",
      })),
      documents: (affidavit.documents || []).map((doc) => ({
        name: doc.name || "",
        type: doc.type || "",
        url: doc.url || "",
        ipfsHash: doc.ipfsHash || "",
      })),
      status: affidavit.status || "Active",
      dateRequested: affidavit.dateRequested ? new Date(affidavit.dateRequested).toISOString() : "",
      dateIssued: affidavit.dateIssued ? new Date(affidavit.dateIssued).toISOString() : "",
      requestId: affidavit.requestId?.toString() || "",
      createdBy: affidavit.createdBy?._id.toString() || "",
    };

    const freshDataHash = generateAffidavitHash(affidavitDataForHash);

    // Fetch blockchain data
    let blockchainData = null;
    let originalData = null;
    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545"); // Ganache
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xED7864989c1f88481C5Ac0242F263DC4CE2D427d";
      const contract = new ethers.Contract(contractAddress, AffidavitRegistryABI, provider);

      const bcData = await contract.getAffidavit(affidavit.displayId);
      blockchainData = {
        affidavitId: bcData[0],
        title: bcData[1],
        category: bcData[2],
        description: bcData[3],
        declaration: bcData[4],
        issuerId: bcData[5],
        sellerId: bcData[6],
        buyerId: bcData[7],
        ipfsHashes: bcData[8],
        dataHash: bcData[9],
        timestamp: Number(bcData[10]),
        onBlockchain: bcData[11],
      };
    } catch (error) {
      console.error("Error fetching blockchain data:", error);
    }

    // Fetch IPFS data via Pinata
    let pinataData = null;
    if (affidavit.ipfsHash) {
      try {
        const pinataResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${affidavit.ipfsHash}`);
        if (pinataResponse.ok) {
          pinataData = await pinataResponse.json();
        }
      } catch (error) {
        console.error("Error fetching Pinata data:", error);
      }
    }

    // Verify hashes
    const isVerified = blockchainData
      ? freshDataHash === blockchainData.dataHash && freshDataHash === affidavit.dataHash
      : freshDataHash === affidavit.dataHash;
    const isTampered = !isVerified;

    // Update affidavit verification status
    affidavit.isVerifiedOnBlockchain = isVerified;
    await affidavit.save();

    // Prepare original data if tampered
    if (isTampered && (pinataData || blockchainData)) {
      originalData = {
        ipfsHash: affidavit.ipfsHash || "N/A",
        title: pinataData?.title || blockchainData?.title || "N/A",
        category: pinataData?.category || blockchainData?.category || "N/A",
        description: pinataData?.description || blockchainData?.description || "N/A",
        declaration: pinataData?.declaration || blockchainData?.declaration || "N/A",
        issuerId: pinataData?.issuerId || blockchainData?.issuerId || "N/A",
        sellerId: pinataData?.sellerId || blockchainData?.sellerId || "N/A",
        buyerId: pinataData?.buyerId || blockchainData?.buyerId || "N/A",
        witnesses: pinataData?.witnesses || blockchainData?.witnessIds || [],
        documents: pinataData?.documents || blockchainData?.ipfsHashes || [],
        dataHash: blockchainData?.dataHash || affidavit.dataHash || "N/A",
      };
    }

    return NextResponse.json({
      success: true,
      verified: isVerified,
      isTampered,
      blockchainData,
      pinataData,
      originalData,
    });
  } catch (error: any) {
    console.error("Error in POST /api/affidavits/verify:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}