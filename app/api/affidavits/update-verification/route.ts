import { type NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import Affidavit from "@/lib/models/affidavit";

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const { id, isVerifiedOnBlockchain } = await request.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid affidavit ID" }, { status: 400 });
    }

    const affidavit = await Affidavit.findById(id);
    if (!affidavit) {
      return NextResponse.json({ success: false, error: "Affidavit not found" }, { status: 404 });
    }

    affidavit.isVerifiedOnBlockchain = isVerifiedOnBlockchain;
    await affidavit.save();

    return NextResponse.json({ success: true, message: "Verification status updated" });
  } catch (error: any) {
    console.error("Error in PATCH /api/affidavits/update-verification:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}