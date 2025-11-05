import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { dbConnect } from "@/lib/db";
import User from "@/lib/models/user";
import Affidavit from "@/lib/models/affidavit";
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
    const users = await User.find().select("name email roles idCardNumber address city phone walletAddress status remarks createdAt").lean();

    // Fetch affidavit counts for each user
    const usersWithAffidavits = await Promise.all(
      users.map(async (user) => {
        const affidavitsCount = await Affidavit.countDocuments({
          $or: [
            { issuerId: user._id },
            { sellerId: user._id },
            { buyerId: user._id },
            { "witnesses.contactId": user._id },
          ],
        });
        return {
          ...user,
          affidavitsCount,
          createdAt: new Date(user.createdAt).toLocaleDateString(), // Format as date only
        };
      })
    );

    // Always return the current user's details, regardless of role
    const userDetails = {
      _id: currentUser._id,
      idCardNumber: currentUser.idCardNumber,
      walletAddress: currentUser.walletAddress,
      activeRole: currentUser.activeRole,
    };

    // Filter issuers (users with "Issuer" role) to return in all cases
    const issuers = usersWithAffidavits.filter((user) => user.roles.includes("Issuer"));

    // If the user is an Admin, return all users with additional data
    if (currentUser.activeRole === "Admin") {
      return NextResponse.json({
        success: true,
        users: usersWithAffidavits,
        issuers,
        currentUser: userDetails,
      });
    }

    // For non-Admins, return a limited set of data
    const limitedUsers = usersWithAffidavits.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      idCardNumber: user.idCardNumber,
      address: user.address,
      city: user.city,
      phone: user.phone,
      walletAddress: user.walletAddress,
      status: user.status,
      remarks: user.remarks,
      createdAt: user.createdAt,
      affidavitsCount: user.affidavitsCount,
    }));

    return NextResponse.json({
      success: true,
      issuers,
      users: limitedUsers,
      currentUser: userDetails,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

//earlier 82 lines