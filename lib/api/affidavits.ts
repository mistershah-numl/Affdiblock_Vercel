import type { Affidavit } from "@/lib/models/affidavit"
import AffidavitModel from "@/lib/models/affidavit"
import mongoose from "mongoose";
import { issueAffidavit, verifyAffidavit } from "@/lib/blockchain"
import { ethers, JsonRpcProvider } from "ethers";

// Create a new affidavit request
export async function createAffidavitRequest(
  affidavitData: Omit<Affidavit, "_id" | "createdAt" | "updatedAt" | "blockchainDetails" | "dateIssued" | "status">,
) {
  try {
    // In a real app, this would connect to MongoDB
    // For demo purposes, we'll just return a mock response

    const affidavit = {
      _id: `aff_${Math.random().toString(36).substr(2, 9)}`,
      ...affidavitData,
      dateIssued: null,
      status: "Pending",
      blockchainDetails: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return { success: true, affidavit }
  } catch (error) {
    console.error("Affidavit request error:", error)
    return { success: false, error: "Failed to create affidavit request" }
  }
}

// Approve an affidavit request (for issuers)
export async function approveAffidavit(affidavitId: string, issuerId: string) {
  try {
    // In a real app, this would update the affidavit in MongoDB
    // and then store it on the blockchain

    // Mock affidavit data
    const affidavit = {
      _id: affidavitId,
      title: "Property Transfer Deed",
      category: "Property",
      issuerId,
      userId: "user_123456789",
      dateRequested: new Date(Date.now() - 86400000), // Yesterday
      dateIssued: new Date(),
      status: "Active",
      parties: [
        { role: "Seller", userId: "user_123456789" },
        { role: "Buyer", userId: "user_987654321" },
      ],
      witnesses: [{ userId: "user_111222333" }],
      description: "This affidavit certifies the transfer of property...",
      declaration: "I hereby declare that the information provided is true...",
      blockchainDetails: null,
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(),
    }

    // Issue on blockchain
    const blockchainResult = await issueAffidavit(affidavitId, affidavit)

    if (blockchainResult.success) {
      // Update affidavit with blockchain details
      const updatedAffidavit = {
        ...affidavit,
        status: "Active",
        dateIssued: new Date(),
        blockchainDetails: {
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          timestamp: blockchainResult.timestamp,
        },
        updatedAt: new Date(),
      }

      return { success: true, affidavit: updatedAffidavit }
    } else {
      return { success: false, error: "Failed to issue affidavit on blockchain" }
    }
  } catch (error) {
    console.error("Approve affidavit error:", error)
    return { success: false, error: "Failed to approve affidavit" }
  }
}

// Reject an affidavit request (for issuers)
export async function rejectAffidavit(affidavitId: string, reason: string) {
  try {
    // In a real app, this would update the affidavit in MongoDB

    // Mock updated affidavit
    const updatedAffidavit = {
      _id: affidavitId,
      status: "Rejected",
      rejectionReason: reason,
      updatedAt: new Date(),
    }

    return { success: true, affidavit: updatedAffidavit }
  } catch (error) {
    console.error("Reject affidavit error:", error)
    return { success: false, error: "Failed to reject affidavit" }
  }
}

// Revoke an affidavit (for issuers and admins)
export async function revokeAffidavit(affidavitId: string, reason?: string, revokedBy?: string) {
  try {
    const updated = await AffidavitModel.findByIdAndUpdate(
      affidavitId,
      {
        status: "Revoked",
        revokeReason: reason || null,
        revokedAt: new Date(),
        revokedBy: revokedBy ? new mongoose.Types.ObjectId(revokedBy) : undefined
      },
      { new: true }
    );

    if (!updated) {
      throw new Error("Affidavit not found");
    }

    return { success: true, affidavit: updated };
  } catch (error) {
    console.error("Failed to revoke affidavit:", error)
    return {
      success: false,
      error: "Failed to revoke affidavit",
    }
  }
}

// Verify an affidavit
export async function verifyAffidavitById(affidavitId: string) {
  try {
    // In a real app, this would first check MongoDB for the affidavit
    // and then verify it on the blockchain

    // Verify on blockchain
    const blockchainResult = await verifyAffidavit(affidavitId)

    if (blockchainResult.success && blockchainResult.isValid) {
      // Mock affidavit data
      const affidavit = {
        _id: affidavitId,
        title: "Property Transfer Deed",
        category: "Property",
        issuerId: "issuer_123456789",
        issuerName: "John Doe",
        userId: "user_123456789",
        dateRequested: new Date(Date.now() - 86400000), // Yesterday
        dateIssued: new Date(Date.now() - 43200000), // 12 hours ago
        status: "Active",
        parties: [
          { role: "Seller", userId: "user_123456789", name: "John Doe" },
          { role: "Buyer", userId: "user_987654321", name: "Jane Smith" },
        ],
        witnesses: [{ userId: "user_111222333", name: "Robert Johnson" }],
        description: "This affidavit certifies the transfer of property...",
        declaration: "I hereby declare that the information provided is true...",
        blockchainDetails: {
          transactionHash: blockchainResult.dataHash,
          blockNumber: 12345678,
          timestamp: blockchainResult.timestamp,
        },
      }

      return {
        success: true,
        isValid: true,
        affidavit,
        blockchainVerification: {
          isValid: true,
          timestamp: blockchainResult.timestamp,
          transactionHash: blockchainResult.dataHash,
        },
      }
    } else {
      return {
        success: true,
        isValid: false,
        error: "Affidavit not found on blockchain or has been revoked",
      }
    }
  } catch (error) {
    console.error("Verify affidavit error:", error)
    return { success: false, error: "Failed to verify affidavit" }
  }
}

// Get affidavits for a user
export async function getUserAffidavits(userId: string) {
  try {
    // In a real app, this would query MongoDB
    // For demo purposes, we'll just return mock data

    const affidavits = [
      {
        _id: "aff_123456789",
        title: "Property Transfer Deed",
        category: "Property",
        issuerId: "issuer_123456789",
        issuerName: "John Doe",
        userId,
        dateRequested: new Date(Date.now() - 86400000), // Yesterday
        dateIssued: new Date(Date.now() - 43200000), // 12 hours ago
        status: "Active",
        blockchainDetails: {
          transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          blockNumber: 12345678,
          timestamp: new Date(Date.now() - 43200000).toISOString(),
        },
      },
      {
        _id: "aff_987654321",
        title: "Vehicle Ownership Transfer",
        category: "Vehicle",
        issuerId: "issuer_123456789",
        issuerName: "John Doe",
        userId,
        dateRequested: new Date(Date.now() - 172800000), // 2 days ago
        dateIssued: null,
        status: "Pending",
        blockchainDetails: null,
      },
    ]

    return { success: true, affidavits }
  } catch (error) {
    console.error("Get user affidavits error:", error)
    return { success: false, error: "Failed to get user affidavits" }
  }
}

// Get affidavits for an issuer
export async function getIssuerAffidavits(issuerId: string) {
  try {
    // In a real app, this would query MongoDB
    // For demo purposes, we'll just return mock data

    const affidavits = [
      {
        _id: "aff_123456789",
        title: "Property Transfer Deed",
        category: "Property",
        issuerId,
        userId: "user_123456789",
        userName: "John Doe",
        dateRequested: new Date(Date.now() - 86400000), // Yesterday
        dateIssued: new Date(Date.now() - 43200000), // 12 hours ago
        status: "Active",
        blockchainDetails: {
          transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          blockNumber: 12345678,
          timestamp: new Date(Date.now() - 43200000).toISOString(),
        },
      },
      {
        _id: "aff_987654321",
        title: "Vehicle Ownership Transfer",
        category: "Vehicle",
        issuerId,
        userId: "user_987654321",
        userName: "Jane Smith",
        dateRequested: new Date(Date.now() - 172800000), // 2 days ago
        dateIssued: null,
        status: "Pending",
        blockchainDetails: null,
      },
      {
        _id: "aff_111222333",
        title: "Business Partnership Agreement",
        category: "Business",
        issuerId,
        userId: "user_111222333",
        userName: "Robert Johnson",
        dateRequested: new Date(Date.now() - 259200000), // 3 days ago
        dateIssued: null,
        status: "Rejected",
        blockchainDetails: null,
      },
    ]

    return { success: true, affidavits }
  } catch (error) {
    console.error("Get issuer affidavits error:", error)
    return { success: false, error: "Failed to get issuer affidavits" }
  }
}

// Get issued affidavits (for issuers)
export async function getIssuedAffidavits(issuerId: string) {
  try {
    const affidavits = await AffidavitModel.find({ 
      issuerId, 
      status: { $regex: '^Accepted$', $options: 'i' } 
    })
      .populate('createdBy', 'name')
      .sort({ dateIssued: -1 })
      .lean();

    const mappedAffidavits = affidavits.map((aff) => ({
      ...aff,
      requesterName: aff.createdBy?.name || "Unknown"
    }));

    return { success: true, affidavits: mappedAffidavits };
  } catch (error) {
    console.error("Get issued affidavits error:", error)
    return { success: false, error: "Failed to get issued affidavits" }
  }
}

// Mark witness as fake (for issuers and admins)
export async function markWitnessAsFake(witnessId: string, affidavitId: string, reason: string) {
  try {
    // In a real app, this would update the witness in MongoDB
    // and potentially update the blockchain record

    // Mock updated witness
    const updatedWitness = {
      userId: witnessId,
      affidavitId,
      isFake: true,
      reason,
      markedAt: new Date(),
    }

    return { success: true, witness: updatedWitness }
  } catch (error) {
    console.error("Mark witness as fake error:", error)
    return { success: false, error: "Failed to mark witness as fake" }
  }
}




//earlier 384 lines of code