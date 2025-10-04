import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { dbConnect } from "@/lib/db";
import User from "@/lib/models/user";
import Affidavit from "@/lib/models/affidavit";
import { verifyToken } from "@/lib/api/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Change: Await params to resolve the Promise and extract userId safely, fixing the Next.js sync-dynamic-apis warning.
    const { id: userId } = await params;
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }
    // Get the Authorization header
    const headersList = await headers();
    const authorization = headersList.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const token = authorization.split(" ")[1];
    const tokenResult = verifyToken(token);
    if (!tokenResult.success || !tokenResult.decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }
    // Connect to the database
    await dbConnect();
    // Fetch the current user to check their role
    const currentUser = await User.findById(tokenResult.decoded.id).select("activeRole");
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    if (currentUser.activeRole !== "Admin") {
      return NextResponse.json({ success: false, error: "Only admins can view user affidavits" }, { status: 403 });
    }
    // Fetch affidavits for this user - No change needed here as the query already fetches all related affidavits (issuer, seller, buyer, witness roles).
    const affidavits = await Affidavit.find({
      $or: [
        { issuerId: userId },
        { sellerId: userId },
        { buyerId: userId },
        { "witnesses.contactId": userId },
      ],
    })
      .sort({ dateRequested: -1 })
      .lean();
    return NextResponse.json({
      success: true,
      affidavits,
    });
  } catch (error) {
    console.error("Error fetching user affidavits:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}