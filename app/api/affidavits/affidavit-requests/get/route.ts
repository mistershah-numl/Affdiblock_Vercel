import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/db"
// Import User model first to ensure it is registered
import User from "@/lib/models/user"
import AffidavitRequest from "@/lib/models/affidavit-request"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const activeRole = searchParams.get("activeRole")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    if (!activeRole) {
      return NextResponse.json({ success: false, error: "Active role is required" }, { status: 400 })
    }

    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid User ID format" }, { status: 400 })
    }

    let query: any = {};

    if (activeRole === "Issuer") {
      // Load only affidavit requests where the user is the issuer
      query = { issuerId: userId };
    } else if (activeRole === "User") {
      // Load affidavit requests where the user is nominated in non-issuer roles (seller, buyer, witness, or creator)
      query = {
        $and: [
          { issuerId: { $ne: userId } }, // Exclude requests where the user is the issuer
          {
            $or: [
              { createdBy: userId },
              { sellerId: userId },
              { buyerId: userId },
              { "witnesses.contactId": userId },
            ],
          },
        ],
      };
    } else {
      // For other roles (e.g., Admin), load all relevant requests
      query = {
        $or: [
          { createdBy: userId },
          { sellerId: userId },
          { buyerId: userId },
          { "witnesses.contactId": userId },
          { issuerId: userId },
        ],
      };
    }

    const affidavitRequests = await AffidavitRequest.find(query)
      .populate("issuerId", "_id name area idCardNumber")
      .populate("sellerId", "_id name idCardNumber")
      .populate("buyerId", "_id name idCardNumber")
      .populate("createdBy", "_id name idCardNumber")
      .populate("witnesses.contactId", "_id name idCardNumber");

    console.log("Populated affidavit requests with documents:", JSON.stringify(affidavitRequests, null, 2));

    return NextResponse.json({
      success: true,
      affidavitRequests: affidavitRequests || [],
    });
  } catch (error: any) {
    console.error("Detailed error fetching affidavit requests:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}