import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { dbConnect } from "@/lib/db";
import IssuerRequest from "@/lib/models/issuer-requests";
import { verifyToken } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  console.log("GET /api/issuer-requests/check called at", new Date().toISOString());

  try {
    const headersList = await headers();
    const authorization = headersList.get("Authorization");
    console.log("Authorization header:", authorization || "Not provided");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      console.log("Missing or invalid Authorization header");
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing or invalid token" },
        { status: 401 }
      );
    }

    const token = authorization.split(" ")[1];
    console.log("Extracted token:", token);

    const tokenResult = verifyToken(token);
    console.log("Token verification result:", {
      success: tokenResult.success,
      decoded: tokenResult.decoded ? { id: tokenResult.decoded.id } : null,
      error: tokenResult.error || null,
    });

    if (!tokenResult.success || !tokenResult.decoded) {
      console.log("Token verification failed");
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    console.log("Connecting to database...");
    await dbConnect();
    console.log("Database connected successfully");

    console.log("Querying IssuerRequest for userId:", tokenResult.decoded.id);
    const existingRequest = await IssuerRequest.findOne({
      userId: tokenResult.decoded.id,
    }).lean();
    console.log("Query result:", existingRequest ? existingRequest : "No request found");

    if (existingRequest) {
      const responseData = {
        _id: existingRequest._id.toString(),
        organization: existingRequest.organization,
        city: existingRequest.city,
        designation: existingRequest.designation,
        dateOfJoining: existingRequest.dateOfJoining,
        status: existingRequest.status,
        createdAt: existingRequest.createdAt,
        licenseUrl: existingRequest.licenseUrl,
        remarks: existingRequest.remarks || null,
      };
      console.log("Response data:", responseData);

      if (existingRequest.status === "Pending") {
        console.log("Found pending request");
        return NextResponse.json({
          success: true,
          hasPendingRequest: true,
          message: "You already have a pending issuer request. Please wait for admin review.",
          data: responseData,
        });
      } else if (existingRequest.status === "Rejected") {
        console.log("Found rejected request");
        return NextResponse.json({
          success: true,
          hasPendingRequest: false,
          message: "Your issuer request was rejected. You cannot submit another request.",
          data: responseData,
        });
      } else if (existingRequest.status === "Approved") {
        console.log("Found approved request");
        return NextResponse.json({
          success: true,
          hasPendingRequest: false,
          message: "Your issuer request has been approved.",
          data: responseData,
        });
      }
    }

    console.log("No issuer request found for user");
    return NextResponse.json({
      success: true,
      hasPendingRequest: false,
      message: "No issuer request found. You can submit a new request.",
    });
  } catch (error: any) {
    console.error("Error in GET /api/issuer-requests/check:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}