import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { dbConnect } from "@/lib/db";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";
import { uploadFile } from "@/lib/upload";

export async function POST(request: NextRequest) {
  console.log("🚀 Starting admin user creation...");

  try {
    const headersList = await headers();
    const authorization = headersList.get("Authorization");
    console.log("📋 Authorization header:", authorization ? `Bearer ${authorization.slice(7, 20)}...` : "Missing");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      console.log("❌ Missing or invalid authorization header");
      return NextResponse.json({ success: false, error: "Unauthorized: Missing or invalid token" }, { status: 401 });
    }

    const token = authorization.split(" ")[1];
    console.log("🔐 Token length:", token.length);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("❌ JWT_SECRET is not configured");
      return NextResponse.json({ success: false, error: "Internal server error: JWT_SECRET missing" }, { status: 500 });
    }

    let decoded: { id: string; email: string; roles: string[]; activeRole: string } | null = null;
    try {
      decoded = jwt.verify(token, secret) as { id: string; email: string; roles: string[]; activeRole: string };
      console.log("🔓 Decoded token:", { id: decoded.id, email: decoded.email, roles: decoded.roles, activeRole: decoded.activeRole });
    } catch (error: any) {
      console.error("❌ Error verifying JWT token:", { message: error.message, name: error.name });
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    await dbConnect();
    console.log("💾 Database connected");

    const adminUser = await User.findById(decoded.id);
    console.log("🔍 Admin user details:", adminUser ? { _id: adminUser._id, name: adminUser.name, activeRole: adminUser.activeRole } : "No user found");

    if (!adminUser) {
      console.log("❌ Admin user not found");
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (adminUser.activeRole !== "Admin") {
      console.log("❌ User is not an admin", { activeRole: adminUser.activeRole });
      return NextResponse.json({ success: false, error: "Only admins can perform this action" }, { status: 403 });
    }

    const formData = await request.formData();
    console.log("📋 Form data keys:", Array.from(formData.keys()));

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const rolesEntries = formData.getAll("roles") as string[];
    const idCardNumber = formData.get("idCardNumber") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const organization = formData.get("organization") as string;
    const city = formData.get("city") as string;
    const designation = formData.get("designation") as string;
    const dateOfJoining = formData.get("dateOfJoining") as string;

    // Map to uppercase and dedupe
    const userRoles = [...new Set(rolesEntries.map(r => r.charAt(0).toUpperCase() + r.slice(1)))];
    const isAdmin = userRoles.includes("Admin");
    const isIssuer = userRoles.includes("Issuer");

    console.log("📊 Form data values:", {
      name: name ? `${name.substring(0, 20)}...` : "Missing",
      email: email || "Missing",
      roles: userRoles,
      idCardNumber: idCardNumber || "Missing",
    });

    // Basic validation
    if (!name || !email || !password || userRoles.length === 0) {
      console.log("❌ Missing or invalid basic fields");
      return NextResponse.json({ success: false, error: "Missing or invalid required fields: name, email, password, roles" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 });
    }

    // Check existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 });
    }

    // Role-specific validation
    let idCardFrontUrl: string | undefined;
    let idCardBackUrl: string | undefined;
    let licenseUrl: string | undefined;
    let parsedDateOfJoining: Date | undefined;

    if (!isAdmin) {
      if (!idCardNumber || idCardNumber.replace(/\D/g, "").length !== 13) {
        return NextResponse.json({ success: false, error: "ID card number is required and must be 13 digits for non-admin users" }, { status: 400 });
      }

      const existingIdCard = await User.findOne({ idCardNumber });
      if (existingIdCard) {
        return NextResponse.json({ success: false, error: "ID card number already registered" }, { status: 400 });
      }

      const idCardFront = formData.get("idCardFront") as File;
      const idCardBack = formData.get("idCardBack") as File;

      if (!idCardFront || !idCardBack) {
        return NextResponse.json({ success: false, error: "ID card front and back images are required for non-admin users" }, { status: 400 });
      }

      // Validate ID card files
      if (idCardFront.size > 5 * 1024 * 1024 || !idCardFront.type.startsWith("image/")) {
        return NextResponse.json({ success: false, error: "ID card front must be an image <5MB" }, { status: 400 });
      }
      if (idCardBack.size > 5 * 1024 * 1024 || !idCardBack.type.startsWith("image/")) {
        return NextResponse.json({ success: false, error: "ID card back must be an image <5MB" }, { status: 400 });
      }

      // Upload ID card front
      try {
        const extFront = idCardFront.name.split(".").pop() || "jpg";
        const frontFilename = `${idCardNumber}_front.${extFront}`;
        const frontBuffer = await idCardFront.arrayBuffer();
        const frontResult = await uploadFile(Buffer.from(frontBuffer), frontFilename, idCardFront.type, "id-cards", idCardNumber);
        idCardFrontUrl = frontResult.url.replace("ivory-implicit-sailfish-377.mypinata.cloud", "gateway.pinata.cloud");
        console.log("✅ ID front uploaded:", idCardFrontUrl);
      } catch (error: any) {
        console.error("❌ Failed to upload ID front:", error.message);
        return NextResponse.json({ success: false, error: `Failed to upload ID card front: ${error.message}` }, { status: 500 });
      }

      // Upload ID card back
      try {
        const extBack = idCardBack.name.split(".").pop() || "jpg";
        const backFilename = `${idCardNumber}_back.${extBack}`;
        const backBuffer = await idCardBack.arrayBuffer();
        const backResult = await uploadFile(Buffer.from(backBuffer), backFilename, idCardBack.type, "id-cards", idCardNumber);
        idCardBackUrl = backResult.url.replace("ivory-implicit-sailfish-377.mypinata.cloud", "gateway.pinata.cloud");
        console.log("✅ ID back uploaded:", idCardBackUrl);
      } catch (error: any) {
        console.error("❌ Failed to upload ID back:", error.message);
        return NextResponse.json({ success: false, error: `Failed to upload ID card back: ${error.message}` }, { status: 500 });
      }
    }

    if (isIssuer) {
      if (!organization || !city || !designation || !dateOfJoining) {
        return NextResponse.json({ success: false, error: "Organization, city, designation, and date of joining are required for Issuer" }, { status: 400 });
      }

      parsedDateOfJoining = new Date(dateOfJoining);
      if (isNaN(parsedDateOfJoining.getTime())) {
        return NextResponse.json({ success: false, error: "Invalid date of joining" }, { status: 400 });
      }

      const license = formData.get("license") as File;
      if (!license) {
        return NextResponse.json({ success: false, error: "License document is required for Issuer" }, { status: 400 });
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
      if (license.size > 10 * 1024 * 1024 || !allowedTypes.includes(license.type)) {
        return NextResponse.json({ success: false, error: "License must be JPEG/PNG/GIF/WebP/PDF <10MB" }, { status: 400 });
      }

      // Upload license
      try {
        const randomNo = Math.floor(1000 + Math.random() * 9000);
        const extLic = license.name.split(".").pop() || "pdf";
        const licFilename = `LICENSE_${idCardNumber}_${randomNo}.${extLic}`;
        const licBuffer = await license.arrayBuffer();
        const licResult = await uploadFile(Buffer.from(licBuffer), licFilename, license.type, "licenses", idCardNumber);
        licenseUrl = licResult.url.replace("ivory-implicit-sailfish-377.mypinata.cloud", "gateway.pinata.cloud");
        console.log("✅ License uploaded:", licenseUrl);
      } catch (error: any) {
        console.error("❌ Failed to upload license:", error.message);
        return NextResponse.json({ success: false, error: `Failed to upload license: ${error.message}` }, { status: 500 });
      }
    }

    // Set activeRole: Admin > Issuer > User
    const activeRole = isAdmin ? "Admin" : isIssuer ? "Issuer" : "User";

    // Create user
    const user = new User({
      name,
      email,
      password,
      ...(idCardNumber && { idCardNumber }),
      ...(phone && { phone }),
      ...(address && { address }),
      roles: userRoles,
      activeRole,
      added_by: decoded.id,
      ...(idCardFrontUrl && { idCardFrontUrl }),
      ...(idCardBackUrl && { idCardBackUrl }),
      ...(isIssuer && {
        organization,
        city,
        designation,
        dateOfJoining: parsedDateOfJoining,
        licenseUrl,
      }),
    });

    console.log("👤 User object before saving:", user.toObject());

    await user.save();
    console.log("✅ User saved:", user._id);

    // Return user without password
    const { password: _, ...userResponse } = user.toObject();

    return NextResponse.json({
      success: true,
      user: userResponse,
    });
  } catch (error: any) {
    console.error("💥 Error in admin user creation:", { message: error.message, stack: error.stack });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}



// previous 227 lines, but stored only issuer incase of only issuer , 