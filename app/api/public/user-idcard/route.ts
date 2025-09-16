import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/lib/models/user";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { userIds } = body;

    // Validate input
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }

    // Limit to reasonable number of IDs to prevent abuse
    if (userIds.length > 10) {
      return NextResponse.json({ success: false, error: "Too many IDs requested" }, { status: 400 });
    }

    // Validate all IDs are valid MongoDB ObjectIds
    const validIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return NextResponse.json({ success: false, error: "No valid IDs provided" }, { status: 400 });
    }

    // Fetch only name and idCardNumber
    const users = await User.find(
      { _id: { $in: validIds } },
      { _id: 1, name: 1, idCardNumber: 1 } // Only return _id, name, and idCardNumber
    ).lean();

    // Create a mapping of userId to name and idCardNumber
    const userMap: Record<string, { name: string; idCardNumber: string }> = {};
    users.forEach(user => {
      if (user.name && user.idCardNumber) {
        userMap[user._id.toString()] = {
          name: user.name,
          idCardNumber: user.idCardNumber,
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: userMap
    });

  } catch (error: any) {
    // Avoid logging error details to prevent information leakage
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}