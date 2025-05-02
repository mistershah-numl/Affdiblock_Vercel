import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AffidavitRequest from "@/lib/models/affidavit-request";
import User from "@/lib/models/user";
import { uploadFile } from "@/lib/upload";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const stampValue = formData.get("stampValue") as string;
    const issuerId = formData.get("issuerId") as string;
    const description = formData.get("description") as string;
    const declaration = formData.get("declaration") as string;
    const userRole = formData.get("userRole") as string;
    const sellerId = formData.get("sellerId") as string | null;
    const buyerId = formData.get("buyerId") as string | null;
    const witnesses = JSON.parse(formData.get("witnesses") as string);
    const details = JSON.parse(formData.get("details") as string);
    const createdBy = formData.get("createdBy") as string;
    const initiatorIdCardNumber = formData.get("initiatorIdCardNumber") as string;
    const files = formData.getAll("documents") as File[];

    // Validate required fields
    if (!title || !category || !stampValue || !issuerId || !description || !declaration || !userRole || !createdBy || !initiatorIdCardNumber) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    if (userRole === "Buyer" && !sellerId) {
      return NextResponse.json({ success: false, error: "Seller ID is required for Buyer role" }, { status: 400 });
    }
    if (userRole === "Seller" && !buyerId) {
      return NextResponse.json({ success: false, error: "Buyer ID is required for Seller role" }, { status: 400 });
    }

    // Fetch ID card numbers for issuer, seller, buyer, and witnesses
    const issuer = await User.findById(issuerId);
    if (!issuer) {
      return NextResponse.json({ success: false, error: "Issuer not found" }, { status: 404 });
    }
    const issuerIdCardNumber = issuer.idCardNumber;

    let sellerIdCardNumber = null;
    let seller = null;
    if (sellerId) {
      seller = await User.findById(sellerId);
      if (!seller) {
        return NextResponse.json({ success: false, error: "Seller not found" }, { status: 404 });
      }
      sellerIdCardNumber = seller.idCardNumber;
    }

    let buyerIdCardNumber = null;
    let buyer = null;
    if (buyerId) {
      buyer = await User.findById(buyerId);
      if (!buyer) {
        return NextResponse.json({ success: false, error: "Buyer not found" }, { status: 404 });
      }
      buyerIdCardNumber = buyer.idCardNumber;
    }

    const witnessesWithIdCard = await Promise.all(
      witnesses.map(async (witness: { contactId: string; name: string }) => {
        const user = await User.findById(witness.contactId);
        return {
          ...witness,
          idCardNumber: user ? user.idCardNumber : null,
          hasAccepted: null, // Witnesses start with null (pending)
        };
      })
    );

    // Handle file uploads
    const uploadedDocuments = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadFile(buffer, file.name, file.type, "affidavit-documents");
        return {
          url: result.url,
          name: file.name,
          type: file.type,
        };
      })
    );

    // Create the affidavit request
    const affidavitRequest = new AffidavitRequest({
      title,
      category,
      stampValue,
      issuerId,
      issuerIdCardNumber,
      issuerAccepted: null, // Issuer starts with null (pending)
      description,
      declaration,
      userRole,
      sellerId: sellerId || undefined,
      sellerIdCardNumber,
      sellerAccepted: userRole === "Seller" ? true : null, // Initiator auto-accepts their role
      buyerId: buyerId || undefined,
      buyerIdCardNumber,
      buyerAccepted: userRole === "Buyer" ? true : null, // Initiator auto-accepts their role
      witnesses: witnessesWithIdCard,
      documents: uploadedDocuments,
      details,
      createdBy,
      initiatorIdCardNumber,
      status: "pending",
    });

    await affidavitRequest.save();

    return NextResponse.json({
      success: true,
      message: "Affidavit request created successfully",
      affidavitRequestId: affidavitRequest._id,
    });
  } catch (error) {
    console.error("Error creating affidavit request:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}