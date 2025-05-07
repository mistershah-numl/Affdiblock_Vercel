import { NextResponse } from "next/server";
import { deployAffidavitContract, verifyAffidavit } from "@/lib/blockchain";

export async function POST(request: Request) {
  try {
    // Dummy data based on the allaffidavits example
    const dummyData = {
      affidavitId: "TEST-AFF-2025-001",
      title: "Test Blockchain Deployment",
      category: "business",
      issuerName: "Dummy Issuer",
      issuerIdCardNumber: "1264567890123",
      dateRequested: new Date("2025-05-05T18:55:21.073Z"),
      dateIssued: new Date(),
      status: "active",
      parties: [
        {
          role: "Issuer",
          name: "Dummy Issuer",
          idCardNumber: "1264567890123",
          userId: "680bcb68597d62168a9e38fe",
        },
        {
          role: "Seller",
          name: "Test Seller",
          idCardNumber: "1234567890988",
          userId: "680b7a42597d62168a9e38e8",
        },
        {
          role: "Buyer",
          name: "Test Buyer",
          idCardNumber: "1710144086797",
          userId: "680a7cfdba2b7f6b3ea7c191",
        },
      ],
      witnesses: [],
      documents: [
        {
          ipfsHash: "QmTestHash123",
        },
      ],
      description: "Test deployment to blockchain",
      declaration: "I declare this is a test",
    };

    // Deploy to blockchain
    const payerAddresses = [dummyData.parties[0].userId]; // Using issuer's userId as payer
    const deploymentResult = await deployAffidavitContract(dummyData, payerAddresses);

    // Verify the deployment
    const verificationResult = await verifyAffidavit(dummyData.affidavitId);

    return NextResponse.json({
      success: true,
      deploymentResult,
      verificationResult,
      message: "Blockchain deployment and verification completed",
    });
  } catch (error: any) {
    console.error("Error in blockchain test deployment:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Internal server error",
    }, { status: 500 });
  }
}