import { type NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Affidavit from "@/lib/models/affidavit";
import { verifyAffidavitOnBlockchain } from "@/lib/services/blockchain-service";
import axios from "axios";
import { ethers } from "ethers";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const affidavitId = searchParams.get("id");

    if (!affidavitId) {
      return NextResponse.json({ success: false, error: "Affidavit ID is required" }, { status: 400 });
    }

    const affidavit = await Affidavit.findOne({ displayId: affidavitId })
      .populate("issuerId", "name idCardNumber walletAddress")
      .populate("sellerId", "name idCardNumber walletAddress")
      .populate("buyerId", "name idCardNumber walletAddress")
      .populate("witnesses.contactId", "name idCardNumber walletAddress")
      .populate("createdBy", "name idCardNumber")
      .lean();

    if (!affidavit) {
      return NextResponse.json({ success: false, error: "Affidavit not found" }, { status: 404 });
    }

    if (!affidavit.transactionHash) {
      await Affidavit.findByIdAndUpdate(affidavit._id, { isVerifiedOnBlockchain: false });
      return NextResponse.json({
        success: false,
        verified: false,
        reason: "Affidavit has not been stored on blockchain yet",
        affidavit,
        blockchainData: null,
        pinataData: null,
        originalData: null,
      }, { status: 400 });
    }

    // Fetch blockchain data
    const blockchainResult = await verifyAffidavitOnBlockchain(affidavitId);

    // Debug log with BigInt handling
    try {
      const stringifyBigInt = (key: string, value: any) =>
        typeof value === "bigint" ? value.toString() : value;
      console.log("Blockchain Result:", JSON.stringify(blockchainResult, stringifyBigInt, 2));
    } catch (logError) {
      console.error("Failed to log blockchainResult:", logError);
    }

    if (!blockchainResult.verified || !blockchainResult.details) {
      await Affidavit.findByIdAndUpdate(affidavit._id, { isVerifiedOnBlockchain: false });
      return NextResponse.json({
        success: true,
        verified: false,
        reason: blockchainResult.reason || "Blockchain verification failed or no details returned",
        affidavit,
        blockchainData: blockchainResult.details || null,
        pinataData: null,
        originalData: blockchainResult.details || null,
      }, { status: 200 });
    }

    // Check if dataHash exists
    if (!blockchainResult.details.dataHash) {
      console.error("Missing dataHash in blockchainResult.details:", blockchainResult.details);
      await Affidavit.findByIdAndUpdate(affidavit._id, { isVerifiedOnBlockchain: false });
      return NextResponse.json({
        success: true,
        verified: false,
        reason: "Blockchain data missing dataHash field",
        affidavit,
        blockchainData: blockchainResult.details,
        pinataData: null,
        originalData: blockchainResult.details,
      }, { status: 200 });
    }

    // Compute fresh hash
    const affidavitDataForHash = {
      displayId: affidavit.displayId,
      title: affidavit.title,
      category: affidavit.category,
      description: affidavit.description,
      declaration: affidavit.declaration,
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
      witnesses: affidavit.witnesses?.map((w: any) => ({
        contactId: w.contactId?._id.toString() || "",
        name: w.contactId?.name || "",
        idCardNumber: w.contactId?.idCardNumber || "",
        walletAddress: w.contactId?.walletAddress || "",
      })) || [],
      documents: affidavit.documents || [],
      status: affidavit.status || "Active",
      dateRequested: affidavit.createdAt,
      dateIssued: affidavit.dateIssued || new Date().toISOString(),
      requestId: affidavit.requestId || "",
      createdBy: affidavit.createdBy?._id.toString() || "",
    };

    const freshDataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(affidavitDataForHash)));
    const isHashMatch = freshDataHash.toLowerCase() === blockchainResult.details.dataHash.toLowerCase();

    // Fetch Pinata data if IPFS hash exists
    let pinataData = null;
    if (affidavit.ipfsHash) {
      try {
        const pinataResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${affidavit.ipfsHash}`, {
          headers: { Accept: "application/json" },
        });
        pinataData = pinataResponse.data;
      } catch (error) {
        console.error("Error fetching Pinata data:", error);
      }
    }

    // Update MongoDB with verification status
    const isVerified = isHashMatch;
    await Affidavit.findByIdAndUpdate(affidavit._id, {
      isVerifiedOnBlockchain: isVerified,
      lastVerifiedAt: new Date(),
    });

    // Prepare original data if tampered
    const mappedOriginalData = !isVerified
      ? {
          ipfsHash: blockchainResult.details.ipfsHash || "N/A",
          displayId: blockchainResult.details.affidavitId || affidavitId,
          title: blockchainResult.details.title || "N/A",
          category: blockchainResult.details.category || "N/A",
          description: blockchainResult.details.description || "N/A",
          declaration: blockchainResult.details.declaration || "N/A",
          issuerId: blockchainResult.details.issuerId || "N/A",
          sellerId: blockchainResult.details.sellerId || "",
          buyerId: blockchainResult.details.buyerId || "",
          witnesses: blockchainResult.details.witnessIds || [],
          documents: blockchainResult.details.ipfsHashes || [],
          dataHash: blockchainResult.details.dataHash || "N/A",
        }
      : null;

    return NextResponse.json({
      success: true,
      verified: isVerified,
      isTampered: !isVerified,
      reason: isVerified ? "Verification successful" : "Data tampering detected",
      affidavit,
      blockchainData: blockchainResult.details,
      pinataData,
      originalData: mappedOriginalData,
    }, { status: 200 });
  } catch (error) {
    console.error("Error verifying affidavit:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

function compareAffidavitData(mongoData: any, pinataData: any) {
  if (!mongoData || !pinataData) return false;

  const normalizeString = (str: string) => (str ? str.trim().toLowerCase() : "");

  const basicChecks = [
    normalizeString(mongoData.displayId) === normalizeString(pinataData.displayId || pinataData.affidavitId),
    normalizeString(mongoData.title) === normalizeString(pinataData.title),
    normalizeString(mongoData.category) === normalizeString(pinataData.category),
    normalizeString(mongoData.description) === normalizeString(pinataData.description),
    normalizeString(mongoData.declaration) === normalizeString(pinataData.declaration),
  ];

  return basicChecks.every((check) => check);
}