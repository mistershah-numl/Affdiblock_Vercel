import { type NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Affidavit from "@/lib/models/affidavit";
import { verifyAffidavitOnBlockchain } from "@/lib/services/blockchain-service";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const affidavitId = searchParams.get("id");

    if (!affidavitId) {
      return NextResponse.json({ success: false, error: "Affidavit ID is required" }, { status: 400 });
    }

    const affidavit = await Affidavit.findOne({ displayId: affidavitId }).lean();
    if (!affidavit) {
      return NextResponse.json({ success: false, error: "Affidavit not found" }, { status: 404 });
    }

    if (!affidavit.transactionHash) {
      return NextResponse.json({
        success: false,
        verified: false,
        reason: "Affidavit has not been stored on blockchain yet",
        affidavit,
      });
    }

    const blockchainResult = await verifyAffidavitOnBlockchain(affidavitId);
    if (!blockchainResult.verified) {
      return NextResponse.json({
        success: true,
        verified: false,
        reason: blockchainResult.reason || "Blockchain verification failed",
        affidavit,
        originalData: null,
      });
    }

    // Fetch Pinata hash content
    const pinataResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${affidavit.ipfsHash}`, {
      headers: { "Accept": "application/json" },
    });
    const pinataData = pinataResponse.data;

    // Compare hashes (simplified: compare IPFS hash from blockchain with stored IPFS hash)
    const isHashMatch = affidavit.ipfsHash === blockchainResult.details.ipfsHash;
    const isAuthentic = isHashMatch && compareAffidavitData(affidavit, blockchainResult.details);

    await Affidavit.findByIdAndUpdate(affidavit._id, {
      isVerifiedOnBlockchain: isAuthentic,
      lastVerifiedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      verified: isAuthentic,
      isTampered: !isAuthentic,
      reason: isAuthentic ? "Verification successful" : "Data tampered detected",
      affidavit,
      blockchainData: blockchainResult.details,
      originalData: isAuthentic ? null : blockchainResult.details, // Show original if tampered
      pinataData,
    });
  } catch (error) {
    console.error("Error verifying affidavit:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function compareAffidavitData(mongoData, blockchainData) {
  if (!mongoData || !blockchainData) return false;

  const basicChecks = [
    mongoData.displayId === blockchainData.affidavitId,
    mongoData.title === blockchainData.title,
    mongoData.category === blockchainData.category,
    mongoData.description === blockchainData.description,
    mongoData.declaration === blockchainData.declaration,
  ];

  return !basicChecks.some((check) => !check);
}