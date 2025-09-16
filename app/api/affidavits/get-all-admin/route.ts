
import { type NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Affidavit, { type IAffidavit } from "@/lib/models/affidavit";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Fetch all affidavits without user-specific filtering
    let affidavits = await Affidavit.find({})
      .populate("issuerId", "name area idCardNumber walletAddress")
      .populate("sellerId", "name idCardNumber walletAddress")
      .populate("buyerId", "name idCardNumber walletAddress")
      .populate("witnesses.contactId", "name idCardNumber")
      .populate("createdBy", "name idCardNumber")
      .sort({ createdAt: -1 });

    // Transform affidavits to plain objects and ensure all affidavits have a status field
    const transformedAffidavits: (IAffidavit & { _id: unknown; __v: number })[] = affidavits.map((affidavit) => {
      const affidavitObj = affidavit.toObject();
      if (!affidavitObj.status) {
        console.warn(`Fixing missing status for affidavit ${affidavitObj._id}`);
        affidavitObj.status = "Active"; // Default status
      }
      return affidavitObj;
    });

    return NextResponse.json({
      success: true,
      affidavits: transformedAffidavits,
    });
  } catch (error) {
    console.error("Error fetching affidavits:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
