import { type NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
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
    let sellerId = formData.get("sellerId") as string | null;
    let buyerId = formData.get("buyerId") as string | null;
    const witnesses = JSON.parse(formData.get("witnesses") as string);
    const details = JSON.parse(formData.get("details") as string);
    const createdBy = formData.get("createdBy") as string;
    const initiatorIdCardNumber = formData.get("initiatorIdCardNumber") as string;
    const files = formData.getAll("documents") as File[];

    // Validate required fields
    if (!title || !category || !stampValue || !issuerId || !description || !declaration || !userRole || !createdBy || !initiatorIdCardNumber) {
      console.error("Missing required fields:", { title, category, stampValue, issuerId, description, declaration, userRole, createdBy, initiatorIdCardNumber });
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Set sellerId or buyerId based on userRole
    if (userRole === "Seller") {
      sellerId = createdBy;
    } else if (userRole === "Buyer") {
      buyerId = createdBy;
    }

    if (userRole === "Buyer" && !sellerId) {
      console.error("Seller ID is required for Buyer role");
      return NextResponse.json({ success: false, error: "Seller ID is required for Buyer role" }, { status: 400 });
    }
    if (userRole === "Seller" && !buyerId) {
      console.error("Buyer ID is required for Seller role");
      return NextResponse.json({ success: false, error: "Buyer ID is required for Seller role" }, { status: 400 });
    }

    // Fetch user data
    const creator = await User.findById(createdBy);
    if (!creator) {
      console.error("Creator not found:", createdBy);
      return NextResponse.json({ success: false, error: "Creator not found" }, { status: 404 });
    }

    const issuer = await User.findById(issuerId);
    if (!issuer) {
      console.error("Issuer not found:", issuerId);
      return NextResponse.json({ success: false, error: "Issuer not found" }, { status: 404 });
    }
    const issuerIdCardNumber = issuer.idCardNumber;

    let sellerIdCardNumber = null;
    let seller = null;
    if (sellerId) {
      seller = await User.findById(sellerId);
      if (!seller) {
        console.error("Seller not found:", sellerId);
        return NextResponse.json({ success: false, error: "Seller not found" }, { status: 404 });
      }
      sellerIdCardNumber = seller.idCardNumber;
    }

    let buyerIdCardNumber = null;
    let buyer = null;
    if (buyerId) {
      buyer = await User.findById(buyerId);
      if (!buyer) {
        console.error("Buyer not found:", buyerId);
        return NextResponse.json({ success: false, error: "Buyer not found" }, { status: 404 });
      }
      buyerIdCardNumber = buyer.idCardNumber;
    }

    const witnessesWithIdCard = await Promise.all(
      witnesses.map(async (witness: { contactId: string; name: string }) => {
        const user = await User.findById(witness.contactId);
        if (!user) {
          console.error("Witness not found:", witness.contactId);
          throw new Error(`Witness not found: ${witness.contactId}`);
        }
        return {
          contactId: witness.contactId,
          hasAccepted: null,
        };
      })
    );

    // Handle file uploads to Pinata only if files are provided
    const uploadedDocuments = await Promise.all(
      files.map(async (file) => {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const result = await uploadFile(buffer, file.name, file.type, "documents");
          if (!result.url || !result.ipfsHash) {
            console.error("Pinata upload failed for file:", file.name, result);
            throw new Error(`Pinata upload failed for ${file.name}`);
          }
          console.log("Pinata upload success:", {
            fileName: file.name,
            url: result.url,
            ipfsHash: result.ipfsHash,
          });
          return {
            url: result.url,
            name: file.name,
            type: file.type,
            ipfsHash: result.ipfsHash,
          };
        } catch (error: any) {
          console.error("Error uploading file to Pinata:", file.name, error.message);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }
      })
    );

    // Generate displayId
    const year = new Date().getFullYear();
    const count = await AffidavitRequest.countDocuments({ createdAt: { $gte: new Date(`${year}-01-01`) } });
    const displayId = `AFFREQ-${year}-${String(count + 1).padStart(3, "0")}`;

    // Log the data to be saved
    console.log("Saving affidavit request with data:", {
      displayId,
      title,
      category,
      stampValue,
      issuerId,
      issuerIdCardNumber,
      description,
      declaration,
      userRole,
      sellerId,
      sellerIdCardNumber,
      buyerId,
      buyerIdCardNumber,
      witnesses: witnessesWithIdCard,
      documents: uploadedDocuments,
      details,
      createdBy,
      initiatorIdCardNumber,
    });

    // Create affidavit request
    const affidavitRequest = new AffidavitRequest({
      displayId,
      title,
      category,
      stampValue,
      issuerId,
      issuerIdCardNumber,
      issuerAccepted: null,
      description,
      declaration,
      userRole,
      sellerId: sellerId || undefined,
      sellerIdCardNumber,
      sellerAccepted: userRole === "Seller" ? true : null,
      buyerId: buyerId || undefined,
      buyerIdCardNumber,
      buyerAccepted: userRole === "Buyer" ? true : null,
      witnesses: witnessesWithIdCard,
      documents: uploadedDocuments,
      details,
      createdBy,
      initiatorIdCardNumber,
      status: "pending",
    });

    // Save to MongoDB
    await affidavitRequest.save();

    // Verify the saved document
    const savedRequest = await AffidavitRequest.findById(affidavitRequest._id).lean();
    if (savedRequest && savedRequest.documents) {
      savedRequest.documents.forEach((doc: any, index: number) => {
        console.log(`Saved document ${index + 1}:`, {
          url: doc.url,
          name: doc.name,
          type: doc.type,
          ipfsHash: doc.ipfsHash,
        });
        if (!doc.ipfsHash && uploadedDocuments[index].ipfsHash) {
          console.warn(`IPFS hash missing for document ${doc.name} in MongoDB`);
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Affidavit request created successfully",
      affidavitRequestId: affidavitRequest._id,
    });
  } catch (error: any) {
    console.error("Error creating affidavit request:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}