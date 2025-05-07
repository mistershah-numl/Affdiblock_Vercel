import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {dbConnect} from "@/lib/db";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";

const JWT_SECRET = process.env.JWT_SECRET || "AFFIDBLOCK";

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const authorization = headersList.get("Authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    const body = await request.json();
    const { walletAddress, network } = body;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return NextResponse.json({ success: false, error: "Invalid wallet address" }, { status: 400 });
    }

    if (!network) {
      return NextResponse.json({ success: false, error: "Network is required" }, { status: 400 });
    }

    await dbConnect();

    const updateResult = await User.updateOne(
      { _id: decoded.id },
      {
        $set: {
          walletAddress,
          walletConnectedAt: new Date(),
          network,
        },
      }
    );

    if (updateResult.modifiedCount !== 1) {
      return NextResponse.json({ success: false, error: "Failed to update wallet" }, { status: 500 });
    }

    const updatedUser = await User.findById(decoded.id);

    return NextResponse.json({
      success: true,
      message: "Wallet connected successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error adding wallet:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const headersList = await headers();
    const authorization = headersList.get("Authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    await dbConnect();

    const updateResult = await User.updateOne(
      { _id: decoded.id },
      {
        $unset: {
          walletAddress: "",
          walletConnectedAt: "",
          network: "",
        },
      }
    );

    if (updateResult.modifiedCount !== 1) {
      return NextResponse.json({ success: false, error: "Failed to remove wallet" }, { status: 500 });
    }

    const updatedUser = await User.findById(decoded.id);

    return NextResponse.json({
      success: true,
      message: "Wallet removed successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error removing wallet:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}