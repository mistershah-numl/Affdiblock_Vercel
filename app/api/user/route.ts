import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {dbConnect} from "@/lib/db";
import User from "@/lib/models/user";
import { verifyToken } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
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

    // Fetch the user from the token to check their role
    const currentUser = await User.findById(tokenResult.decoded.id).select("activeRole idCardNumber walletAddress");
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Fetch all users from MongoDB (excluding passwords)
    const users = await User.find().select("name email roles idCardNumber area walletAddress").lean();

    // Always return the current user's details, regardless of role
    const userDetails = {
      _id: currentUser._id,
      idCardNumber: currentUser.idCardNumber,
      walletAddress: currentUser.walletAddress,
      activeRole: currentUser.activeRole, // Include activeRole for debugging
    };

    // Filter issuers (users with "Issuer" role) to return in all cases
    const issuers = users.filter((user) => user.roles.includes("Issuer"));

    // If the user is an Admin, return all users with additional data
    if (currentUser.activeRole === "Admin") {
      const usersWithAffidavits = users.map((user) => ({
        ...user,
        affidavitsCount: 0, // Replace with actual logic if you have an affidavits collection
      }));
      return NextResponse.json({
        success: true,
        users: usersWithAffidavits,
        issuers, // Include issuers even for Admin
        currentUser: userDetails, // Always include currentUser
      });
    }

    // For non-Admins, return a limited set of data
    const limitedUsers = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      idCardNumber: user.idCardNumber,
      area: user.area,
      walletAddress: user.walletAddress,
    }));

    return NextResponse.json({
      success: true,
      issuers, // Always return issuers
      users: limitedUsers,
      currentUser: userDetails,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}