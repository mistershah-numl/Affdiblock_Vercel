import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/db";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "AFFIDBLOCK";

export async function PUT(request: Request) {
  try {
    const headersList = await headers();
    const authorization = headersList.get("Authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    const body = await request.json();
    const { language, timezone, sessionTimeout } = body;

    if (!language || !timezone || !sessionTimeout) {
      return NextResponse.json({ success: false, error: "All settings are required" }, { status: 400 });
    }

    await dbConnect();

    const updateResult = await User.updateOne(
      { _id: decoded.id },
      {
        $set: {
          language,
          timezone,
          sessionTimeout: parseInt(sessionTimeout),
        },
      }
    );

    if (updateResult.modifiedCount !== 1) {
      return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
    }

    const updatedUser = await User.findById(decoded.id);

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}