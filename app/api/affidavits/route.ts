import { NextRequest, NextResponse } from "next/server"
import Affidavit from "@/lib/models/affidavit"
import { createAffidavitRequest, getUserAffidavits } from "@/lib/api/affidavits"
import { verifyToken } from "@/lib/api/auth"

// Create a new affidavit request
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const tokenResult = verifyToken(token);

    if (!tokenResult.success) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { title, category, issuerId, parties, witnesses, description, declaration, ...additionalData } = body;

    // Validate input
    if (!title || !category || !issuerId || !description || !declaration) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Create affidavit request
    const result = await createAffidavitRequest({
      title,
      category,
      issuerId,
      userId: tokenResult.decoded.id,
      dateRequested: new Date(),
      parties: parties || [],
      witnesses: witnesses || [],
      description,
      declaration,
      ...additionalData,
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Create affidavit error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// Get affidavits for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const tokenResult = verifyToken(token);

    if (!tokenResult.success) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const userId = tokenResult.decoded.id;
    const { searchParams } = new URL(request.url);

    if (searchParams.get('type') === 'issued') {
      // Fetch all issued affidavits for issuer (any status)
      const affidavits = await Affidavit.find({ 
        issuerId: userId 
      })
        .populate({
          path: 'createdBy',
          select: 'name'
        })
        .sort({ dateIssued: -1 })
        .lean();

      const mappedAffidavits = affidavits.map((aff) => ({
        ...aff,
        requesterName: aff.createdBy?.name || "Unknown"
      }));

      return NextResponse.json({ success: true, affidavits: mappedAffidavits });
    } else {
      // Existing logic: Fetch affidavits for the user (non-issued)
      const result = await getUserAffidavits(userId);

      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
    }
  } catch (error) {
    console.error("Get affidavits error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}


//earlier 83 lines and working 