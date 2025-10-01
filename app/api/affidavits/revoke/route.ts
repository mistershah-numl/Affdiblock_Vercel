import { NextRequest, NextResponse } from "next/server"
import Affidavit from "@/lib/models/affidavit"
import { verifyToken } from "@/lib/api/auth"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const tokenResult = verifyToken(token);

    if (!tokenResult.success) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const { currentAffidavitId, basisDisplayId, reason } = await request.json();

    if (!currentAffidavitId || !basisDisplayId) {
      return NextResponse.json({ success: false, error: "Current Affidavit ID and Basis Display ID required" }, { status: 400 });
    }

    // Validate basis affidavit exists and is Active
    const basisAffidavit = await Affidavit.findOne({ displayId: basisDisplayId, status: "Active" });
    if (!basisAffidavit) {
      return NextResponse.json({ success: false, error: "Provided basis affidavit ID does not exist or is not active" }, { status: 400 });
    }

    const updated = await Affidavit.findByIdAndUpdate(
      currentAffidavitId,
      {
        status: "Revoked",
        revokeReason: reason || null,
        revokedAt: new Date(),
        revokedBy: tokenResult.decoded.id,
        basisDisplayId: basisDisplayId
      },
      { new: true }
    ).populate('revokedBy', 'name');

    if (!updated) {
      return NextResponse.json({ success: false, error: "Current affidavit not found or already revoked" }, { status: 404 });
    }

    return NextResponse.json({ success: true, affidavit: updated });
  } catch (error) {
    console.error("Revoke affidavit error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}