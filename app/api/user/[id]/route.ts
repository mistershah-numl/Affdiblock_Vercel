import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { dbConnect } from "@/lib/db";
import User from "@/lib/models/user";
import Affidavit from "@/lib/models/affidavit";
import { verifyToken } from "@/lib/api/auth";
import mongoose from "mongoose";

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
      return NextResponse.json({ success: false, error: "Only admins can view user details" }, { status: 403 });
    }
    // Fetch the specific user with all fields except password
    const user = await User.findById(userId).select("-password").lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    // Fetch affidavit counts for this user
    const totalCount = await Affidavit.countDocuments({
      $or: [
        { issuerId: userId },
        { sellerId: userId },
        { buyerId: userId },
        { "witnesses.contactId": userId },
      ],
    });
    const acceptedCount = await Affidavit.countDocuments({
      $or: [
        { issuerId: userId },
        { sellerId: userId },
        { buyerId: userId },
        { "witnesses.contactId": userId },
      ],
      status: "Active",
    });
    const rejectedCount = await Affidavit.countDocuments({
      $or: [
        { issuerId: userId },
        { sellerId: userId },
        { buyerId: userId },
        { "witnesses.contactId": userId },
      ],
      status: { $in: ["Rejected", "Revoked"] },
    });
    const witnessedCount = await Affidavit.countDocuments({
      "witnesses.contactId": userId,
    });
    return NextResponse.json({
      success: true,
      user,
      affidavitsCounts: {
        total: totalCount,
        accepted: acceptedCount,
        rejected: rejectedCount,
        witnessed: witnessedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ success: false, error: "Only admins can update user" }, { status: 403 });
    }
    // Fetch the specific user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    const body = await request.json();
    if (body.action === 'ban') {
      const { banReason, banDuration } = body;
      if (!banReason) {
        return NextResponse.json({ success: false, error: "Ban reason is required" }, { status: 400 });
      }
      const remarks = `${banReason} (Duration: ${banDuration || 'Permanent'})`;
      const updated = await User.findByIdAndUpdate(
        userId,
        { status: 'Banned', remarks },
        { new: true }
      ).select('-password');
      return NextResponse.json({ success: true, user: updated });
    } else {
      // update
      const { name, email, roles, activeRole, status, remarks } = body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (roles !== undefined) updateData.roles = roles;
      if (activeRole !== undefined) updateData.activeRole = activeRole;
      if (status !== undefined) updateData.status = status;
      if (remarks !== undefined) updateData.remarks = remarks;
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ success: false, error: "No update data provided" }, { status: 400 });
      }
      const updated = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
      return NextResponse.json({ success: true, user: updated });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}