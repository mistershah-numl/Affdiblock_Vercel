import { type NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import AffidavitRequest from "@/lib/models/affidavit-request";
import Affidavit from "@/lib/models/affidavit";
import User from "@/lib/models/user";
import { uploadFileToIPFSOnServer, uploadJSONToIPFS } from "@/lib/services/ipfs-service";
import path from "path";
import fs from "fs/promises";
import { ethers } from "ethers";
import { issueAffidavit, getConnectedMetaMaskWallet, getWalletBalance } from "@/lib/blockchain";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { requestId, userId, activeRole, action, transactionHash, blockNumber, affidavitId } = await request.json();

    console.log("Received request:", {
      requestId,
      userId,
      activeRole,
      action,
      transactionHash: transactionHash ? "Present" : "Not present",
      blockNumber: blockNumber ? blockNumber : "Not present",
      affidavitId: affidavitId || "Not present",
    });

    // Blockchain update request
    if (transactionHash && blockNumber && affidavitId) {
      const affidavit = await Affidavit.findOne({ displayId: affidavitId });
      if (!affidavit) {
        return NextResponse.json(
          { success: false, error: "Affidavit not found for blockchain update" },
          { status: 404 }
        );
      }

      affidavit.transactionHash = transactionHash;
      affidavit.blockNumber = Number(blockNumber);
      affidavit.isVerifiedOnBlockchain = true;
      affidavit.lastVerifiedAt = new Date();
      await affidavit.save();

      return NextResponse.json({
        success: true,
        message: "Affidavit updated with blockchain details successfully",
      });
    }

    // Regular request processing
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
    let affidavitData = null;

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

        // Check if MetaMask wallet is connected
        const wallet = await getConnectedMetaMaskWallet();
        if (!wallet) {
          return NextResponse.json(
            { success: false, error: "MetaMask wallet not connected. Please connect your wallet to proceed." },
            { status: 400 }
          );
        }

        const displayId = await Affidavit.generateDisplayId();
        let ipfsHash = "";
        let documentsWithIPFS: any[] = [];

        // Always prepare affidavit metadata, even if there are no documents
        const affidavitMetadata = {
          affidavitId: displayId,
          title: affidavitRequest.title,
          category: affidavitRequest.category,
          description: affidavitRequest.description,
          declaration: affidavitRequest.declaration,
          issuer: {
            id: affidavitRequest.issuerId._id.toString(),
            idCardNumber: affidavitRequest.issuerId.idCardNumber,
            walletAddress: affidavitRequest.issuerId.walletAddress,
          },
          seller: affidavitRequest.sellerId
            ? {
                id: affidavitRequest.sellerId._id.toString(),
                idCardNumber: affidavitRequest.sellerId.idCardNumber,
                walletAddress: affidavitRequest.sellerId.walletAddress,
              }
            : null,
          buyer: affidavitRequest.buyerId
            ? {
                id: affidavitRequest.buyerId._id.toString(),
                idCardNumber: affidavitRequest.buyerId.idCardNumber,
                walletAddress: affidavitRequest.buyerId.walletAddress,
              }
            : null,
          witnesses: affidavitRequest.witnesses.map((w) => ({
            id: w.contactId._id.toString(),
            idCardNumber: w.contactId.idCardNumber,
            walletAddress: w.contactId.walletAddress,
          })),
          documents: [], // Will be populated if documents exist
          dateRequested: affidavitRequest.createdAt,
          dateIssued: new Date(),
        };

        // Process documents if they exist
        if (affidavitRequest.documents && affidavitRequest.documents.length > 0) {
          documentsWithIPFS = await Promise.all(
            affidavitRequest.documents.map(async (doc) => {
              if (doc.url) {
                const relativePath = doc.url.replace(/^.*public[/\\]/i, "").replace(/^[\\/]/, "");
                const absolutePath = path.join(process.cwd(), "public", relativePath);
                try {
                  await fs.access(absolutePath);
                } catch {
                  return { ...doc, ipfsHash: null };
                }
                const fileHash = await uploadFileToIPFSOnServer(relativePath);
                return { ...doc, ipfsHash: fileHash };
              }
              return { ...doc, ipfsHash: null };
            })
          );

          affidavitMetadata.documents = documentsWithIPFS
            .filter((doc) => doc.ipfsHash)
            .map((doc) => ({
              name: doc.name,
              type: doc.type,
              ipfsHash: doc.ipfsHash,
            }));
        }

        // Upload metadata to Pinata regardless of documents
        ipfsHash = await uploadJSONToIPFS(affidavitMetadata, `Affidavit-${displayId}`);

        // Prepare blockchain data
        const blockchainData = {
          affidavitId: displayId,
          title: affidavitRequest.title,
          category: affidavitRequest.category,
          description: affidavitRequest.description,
          declaration: affidavitRequest.declaration,
          issuerAddress: affidavitRequest.issuerId.walletAddress || ethers.ZeroAddress,
          sellerAddress: affidavitRequest.sellerId?.walletAddress || ethers.ZeroAddress,
          buyerAddress: affidavitRequest.buyerId?.walletAddress || ethers.ZeroAddress,
          witnessIds: affidavitRequest.witnesses.map((w) => w.contactId.idCardNumber),
          ipfsHash,
        };

        // Distribute gas fees
        const payerAddresses = [
          affidavitRequest.issuerId.walletAddress || ethers.ZeroAddress,
        ];
        if (affidavitRequest.sellerId?.walletAddress && affidavitRequest.sellerAccepted === true) {
          payerAddresses.push(affidavitRequest.sellerId.walletAddress);
        }
        if (affidavitRequest.buyerId?.walletAddress && affidavitRequest.buyerAccepted === true) {
          payerAddresses.push(affidavitRequest.buyerId.walletAddress);
        }

        // Silent transaction for non-issuer parties
        for (const address of payerAddresses.slice(1)) {
          if (address !== ethers.ZeroAddress) {
            const balance = await getWalletBalance(address);
            if (parseFloat(balance) > 0.01) {
              console.log(`Silently deducting gas from ${address}`);
            }
          }
        }

        // Issuer transaction with MetaMask popup
        const txResult = await issueAffidavit(displayId, blockchainData, ""); // Token placeholder

        // Only update the database if the blockchain transaction succeeds
        affidavitRequest.status = "accepted";
        await affidavitRequest.save();

        const newAffidavit = new Affidavit({
          displayId,
          title: affidavitRequest.title,
          category: affidavitRequest.category,
          description: affidavitRequest.description,
          declaration: affidavitRequest.declaration,
          issuerId: affidavitRequest.issuerId._id,
          issuerName: affidavitRequest.issuerId.name,
          issuerIdCardNumber: affidavitRequest.issuerId.idCardNumber,
          sellerId: affidavitRequest.sellerId?._id,
          sellerName: affidavitRequest.sellerId?.name,
          sellerIdCardNumber: affidavitRequest.sellerId?.idCardNumber,
          buyerId: affidavitRequest.buyerId?._id,
          buyerName: affidavitRequest.buyerId?.name,
          buyerIdCardNumber: affidavitRequest.buyerId?.idCardNumber,
          witnesses: affidavitRequest.witnesses.map((w) => ({
            contactId: w.contactId._id,
            name: w.contactId.name,
            idCardNumber: w.contactId.idCardNumber,
          })),
          documents: documentsWithIPFS,
          ipfsHash,
          transactionHash: txResult.transactionHash,
          blockNumber: txResult.blockNumber,
          isVerifiedOnBlockchain: true,
          status: "Active",
          dateRequested: new Date(affidavitRequest.createdAt),
          dateIssued: new Date(),
          requestId: affidavitRequest._id,
          createdBy: affidavitRequest.createdBy._id,
        });

        await newAffidavit.save();
        affidavitData = { ...blockchainData, transactionHash: txResult.transactionHash, blockNumber: txResult.blockNumber };
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
      affidavitData,
    });
  } catch (error) {
    console.error("Error responding to affidavit request:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}