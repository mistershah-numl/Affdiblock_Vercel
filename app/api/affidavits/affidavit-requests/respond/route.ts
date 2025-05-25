import { type NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import AffidavitRequest from "@/lib/models/affidavit-request";
import Affidavit from "@/lib/models/affidavit";
import User from "@/lib/models/user";
import { keccak256 } from "ethers";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { requestId, userId, activeRole, action, transactionHash, blockNumber, displayId } = await request.json();

    console.log("Received request:", {
      requestId,
      userId,
      activeRole,
      action,
      transactionHash: transactionHash ? "Present" : "Not present",
      blockNumber: blockNumber ? blockNumber : "Not present",
      displayId: displayId || "Not present",
    });

    // Validate required fields
    if (!requestId || !userId || !activeRole || !action) {
      return NextResponse.json({ success: false, error: "Missing or invalid required fields" }, { status: 400 });
    }

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action: must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(requestId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid ID format" }, { status: 400 });
    }

    const affidavitRequest = await AffidavitRequest.findById(requestId)
      .populate("issuerId", "_id name area idCardNumber walletAddress")
      .populate("sellerId", "_id name idCardNumber walletAddress")
      .populate("buyerId", "_id name idCardNumber walletAddress")
      .populate("createdBy", "_id name idCardNumber walletAddress")
      .populate("witnesses.contactId", "_id name idCardNumber walletAddress");

    if (!affidavitRequest) {
      return NextResponse.json({ success: false, error: "Affidavit request not found" }, { status: 404 });
    }

    const isAccepted = action === "accept";

    if (activeRole === "Issuer" && affidavitRequest.issuerId._id.toString() === userId) {
      affidavitRequest.issuerAccepted = isAccepted;

      if (isAccepted) {
        const allPartiesAccepted =
          (affidavitRequest.sellerId ? affidavitRequest.sellerAccepted === true : true) &&
          (affidavitRequest.buyerId ? affidavitRequest.buyerAccepted === true : true) &&
          affidavitRequest.witnesses.every((w) => w.hasAccepted === true || w.hasAccepted === null);

        if (!allPartiesAccepted) {
          return NextResponse.json(
            { success: false, error: "All parties must accept before issuer can proceed" },
            { status: 400 }
          );
        }

        if (transactionHash && blockNumber && displayId) {
          const issuerUser = await User.findById(userId).select("walletAddress");
          if (!issuerUser) {
            return NextResponse.json(
              { success: false, error: "Issuer not found in database" },
              { status: 400 }
            );
          }
          if (!issuerUser.walletAddress) {
            return NextResponse.json(
              { success: false, error: "Issuer wallet address is not set. Please connect your blockchain wallet and try again." },
              { status: 400 }
            );
          }

          const finalDisplayId = displayId; // Use provided displayId
          let ipfsHash = affidavitRequest.documents?.[0]?.ipfsHash || "";

          // Prepare affidavit metadata
          const affidavitMetadata = {
            affidavitId: finalDisplayId,
            title: affidavitRequest.title,
            category: affidavitRequest.category,
            description: affidavitRequest.description,
            declaration: affidavitRequest.declaration,
            issuerId: affidavitRequest.issuerId._id.toString(),
            sellerId: affidavitRequest.sellerId?._id.toString() || "",
            buyerId: affidavitRequest.buyerId?._id.toString() || "",
            witnesses: affidavitRequest.witnesses.map((w) => ({
              id: w.contactId._id.toString(),
              walletAddress: w.contactId.walletAddress,
            })),
            documents: affidavitRequest.documents.map((doc) => ({
              name: doc.name,
              type: doc.type,
              ipfsHash: doc.ipfsHash || null,
            })),
            dateRequested: affidavitRequest.createdAt,
            dateIssued: new Date(),
          };

          // Hash all affidavit data for MongoDB
          const affidavitDataForHash = {
            ...affidavitMetadata,
            issuerId: affidavitRequest.issuerId._id.toString(),
            issuerName: affidavitRequest.issuerId.name,
            issuerIdCardNumber: affidavitRequest.issuerId.idCardNumber,
            issuerWalletAddress: affidavitRequest.issuerId.walletAddress,
            sellerId: affidavitRequest.sellerId?._id.toString(),
            sellerName: affidavitRequest.sellerId?.name,
            sellerIdCardNumber: affidavitRequest.sellerId?.idCardNumber,
            sellerWalletAddress: affidavitRequest.sellerId?.walletAddress,
            buyerId: affidavitRequest.buyerId?._id.toString(),
            buyerName: affidavitRequest.buyerId?.name,
            buyerIdCardNumber: affidavitRequest.buyerId?.idCardNumber,
            buyerWalletAddress: affidavitRequest.buyerId?.walletAddress,
            witnesses: affidavitRequest.witnesses.map((w) => ({
              contactId: w.contactId._id.toString(),
              name: w.contactId.name,
              idCardNumber: w.contactId.idCardNumber,
              walletAddress: w.contactId.walletAddress,
            })),
            requestId: affidavitRequest._id.toString(),
            createdBy: affidavitRequest.createdBy._id.toString(),
            status: "Active",
          };

          const dataHash = keccak256(Buffer.from(JSON.stringify(affidavitDataForHash)));

          // Create new affidavit document
          const newAffidavit = new Affidavit({
            displayId: finalDisplayId,
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
            })),
            documents: affidavitRequest.documents,
            ipfsHash,
            dataHash,
            transactionHash,
            blockNumber: Number(blockNumber),
            isVerifiedOnBlockchain: true,
            status: "Active",
            dateRequested: new Date(affidavitRequest.createdAt),
            dateIssued: new Date(),
            requestId: affidavitRequest._id,
            createdBy: affidavitRequest.createdBy._id,
          });

          await newAffidavit.save();
          affidavitRequest.status = "accepted";
          await affidavitRequest.save();

          return NextResponse.json({
            success: true,
            message: "Affidavit accepted and updated with blockchain details successfully",
          });
        } else {
          // If no blockchain data, keep status pending
          affidavitRequest.status = "pending";
          affidavitRequest.issuerAccepted = null;
          await affidavitRequest.save();
          return NextResponse.json(
            { success: false, error: "Blockchain transaction details are required for issuer acceptance" },
            { status: 400 }
          );
        }
      } else {
        affidavitRequest.status = "rejected";
        await affidavitRequest.save();
      }
    } else if (!isAccepted) {
      affidavitRequest.status = "rejected";
      await affidavitRequest.save();
    } else {
      if (affidavitRequest.sellerId && affidavitRequest.sellerId._id.toString() === userId) {
        affidavitRequest.sellerAccepted = isAccepted;
      } else if (affidavitRequest.buyerId && affidavitRequest.buyerId._id.toString() === userId) {
        affidavitRequest.buyerAccepted = isAccepted;
      } else if (affidavitRequest.witnesses.some((w) => w.contactId._id.toString() === userId)) {
        affidavitRequest.witnesses.forEach((w) => {
          if (w.contactId._id.toString() === userId) w.hasAccepted = isAccepted;
        });
        affidavitRequest.markModified("witnesses");
      } else {
        return NextResponse.json({ success: false, error: "User is not a party to this request" }, { status: 403 });
      }

      const anyPartyRejected =
        affidavitRequest.issuerAccepted === false ||
        (affidavitRequest.sellerId && affidavitRequest.sellerAccepted === false) ||
        (affidavitRequest.buyerId && affidavitRequest.buyerAccepted === false) ||
        affidavitRequest.witnesses.some((w) => w.hasAccepted === false);
      affidavitRequest.status = anyPartyRejected ? "rejected" : "pending";
      await affidavitRequest.save();
    }

    return NextResponse.json({
      success: true,
      message: `Affidavit request ${isAccepted ? "accepted" : "rejected"} successfully`,
    });
  } catch (error: any) {
    console.error("Error in POST /api/affidavits/affidavit-requests/respond:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}