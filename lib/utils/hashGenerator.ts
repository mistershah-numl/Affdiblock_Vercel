import { ethers } from "ethers";

// Interface for affidavit data to ensure consistent structure
interface AffidavitData {
  displayId: string;
  title: string;
  category: string;
  description: string;
  declaration: string;
  issuerId: string;
  issuerName: string;
  issuerIdCardNumber: string;
  issuerWalletAddress: string;
  sellerId: string;
  sellerName: string;
  sellerIdCardNumber: string;
  sellerWalletAddress: string;
  buyerId: string;
  buyerName: string;
  buyerIdCardNumber: string;
  buyerWalletAddress: string;
  witnesses: Array<{
    contactId: string;
    name: string;
    idCardNumber: string;
    walletAddress: string;
  }>;
  documents: Array<{
    name: string;
    type: string;
    url: string;
    ipfsHash?: string;
  }>;
  status: string;
  dateRequested: string | Date;
  dateIssued: string | Date;
  requestId: string;
  createdBy: string;
}

// Utility function to generate a consistent dataHash
export function generateAffidavitHash(data: AffidavitData): string {
  // Normalize and structure the data
  const normalizedData = {
    displayId: data.displayId || "",
    title: data.title || "",
    category: data.category || "",
    description: data.description || "",
    declaration: data.declaration || "",
    issuerId: data.issuerId || "",
    issuerName: data.issuerName || "",
    issuerIdCardNumber: data.issuerIdCardNumber || "",
    issuerWalletAddress: data.issuerWalletAddress || "",
    sellerId: data.sellerId || "",
    sellerName: data.sellerName || "",
    sellerIdCardNumber: data.sellerIdCardNumber || "",
    sellerWalletAddress: data.sellerWalletAddress || "",
    buyerId: data.buyerId || "",
    buyerName: data.buyerName || "",
    buyerIdCardNumber: data.buyerIdCardNumber || "",
    buyerWalletAddress: data.buyerWalletAddress || "",
    witnesses: (data.witnesses || []).map((w) => ({
      contactId: w.contactId || "",
      name: w.name || "",
      idCardNumber: w.idCardNumber || "",
      walletAddress: w.walletAddress || "",
    })),
    documents: (data.documents || []).map((doc) => ({
      name: doc.name || "",
      type: doc.type || "",
      url: doc.url || "",
      ipfsHash: doc.ipfsHash || "",
    })),
    status: data.status || "Active",
    dateRequested: data.dateRequested ? new Date(data.dateRequested).toISOString() : "",
    dateIssued: data.dateIssued ? new Date(data.dateIssued).toISOString() : "",
    requestId: data.requestId || "",
    createdBy: data.createdBy || "",
  };

  // Stringify with consistent formatting and sorted keys
  const dataString = JSON.stringify(normalizedData, Object.keys(normalizedData).sort());

  // Generate hash using ethers
  return ethers.keccak256(ethers.toUtf8Bytes(dataString));
}