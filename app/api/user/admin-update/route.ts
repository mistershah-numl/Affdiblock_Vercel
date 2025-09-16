import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { dbConnect } from "@/lib/db";
import User from "@/lib/models/user";
import { verifyToken } from "@/lib/api/auth";

export async function PUT(request: Request) {
  try {
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

    const body = await request.json();
    console.log("PUT /api/user/admin-update request body:", body);
    const { userId, name, email, roles, activeRole, status, remarks, licenseUrl, organization, city, designation, dateOfJoining } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    await dbConnect();

    // Verify the requesting user is an admin
    const adminUser = await User.findById(tokenResult.decoded.id);
    if (!adminUser || adminUser.activeRole !== "Admin") {
      return NextResponse.json({ success: false, error: "Only admins can perform this action" }, { status: 403 });
    }

    // Find the target user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Validate and update roles if provided
    if (roles) {
      // Ensure 'User' role is always included
      const updatedRoles = Array.isArray(roles) && roles.length > 0 ? [...new Set([...roles, "User"])] : ["User"];
      user.roles = updatedRoles;

      // Ensure activeRole is in roles
      if (!updatedRoles.includes(user.activeRole)) {
        user.activeRole = updatedRoles[0]; // Set to first role (will be 'User' if no other roles)
      }
    }

    // Validate activeRole if provided
    if (activeRole) {
      if (!user.roles.includes(activeRole)) {
        return NextResponse.json({ success: false, error: "Invalid active role selected" }, { status: 400 });
      }
      user.activeRole = activeRole;
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (status) user.status = status;
    if (remarks) user.remarks = remarks;
    if (licenseUrl) user.licenseUrl = licenseUrl;
    if (organization) user.organization = organization;
    if (city) user.city = city;
    if (designation) user.designation = designation;
    if (dateOfJoining) user.dateOfJoining = new Date(dateOfJoining);

    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        idCardNumber: user.idCardNumber,
        idCardFrontUrl: user.idCardFrontUrl,
        idCardBackUrl: user.idCardBackUrl,
        address: user.address,
        bio: user.bio,
        walletAddress: user.walletAddress,
        roles: user.roles,
        activeRole: user.activeRole,
        status: user.status,
        remarks: user.remarks,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        licenseUrl: user.licenseUrl,
        organization: user.organization,
        city: user.city,
        designation: user.designation,
        dateOfJoining: user.dateOfJoining,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}


// earlier 100 lines