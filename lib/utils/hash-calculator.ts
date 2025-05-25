import { ethers } from "ethers"

export interface AffidavitHashData {
  displayId: string
  title: string
  category: string
  description: string
  declaration: string
  issuerId: string
  issuerName: string
  issuerIdCardNumber: string
  issuerWalletAddress: string
  sellerId: string
  sellerName: string
  sellerIdCardNumber: string
  sellerWalletAddress: string
  buyerId: string
  buyerName: string
  buyerIdCardNumber: string
  buyerWalletAddress: string
  witnesses: Array<{
    contactId: string
    name: string
    idCardNumber: string
    walletAddress: string
  }>
  documents: Array<{
    name: string
    type: string
    ipfsHash?: string
  }>
  status: string
  dateRequested: string | Date
  dateIssued: string | Date
  requestId: string
  createdBy: string
}

export function calculateAffidavitDataHash(data: AffidavitHashData): string {
  // Normalize the data structure to ensure consistent hashing
  const normalizedData: AffidavitHashData = {
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
    documents: (data.documents || []).map((d) => ({
      name: d.name || "",
      type: d.type || "",
      ipfsHash: d.ipfsHash || "",
    })),
    status: data.status || "Active",
    dateRequested:
      typeof data.dateRequested === "string" ? data.dateRequested : new Date(data.dateRequested).toISOString(),
    dateIssued: typeof data.dateIssued === "string" ? data.dateIssued : new Date(data.dateIssued).toISOString(),
    requestId: data.requestId || "",
    createdBy: data.createdBy || "",
  }

  // Convert to JSON string with consistent ordering
  const jsonString = JSON.stringify(normalizedData, Object.keys(normalizedData).sort())

  // Calculate hash
  return ethers.keccak256(ethers.toUtf8Bytes(jsonString))
}

export function prepareAffidavitDataForHash(affidavitRequest: any, displayId: string): AffidavitHashData {
  return {
    displayId,
    title: affidavitRequest.title || "",
    category: affidavitRequest.category || "",
    description: affidavitRequest.description || "",
    declaration: affidavitRequest.declaration || "",
    issuerId: affidavitRequest.issuerId?._id?.toString() || affidavitRequest.issuerId || "",
    issuerName: affidavitRequest.issuerId?.name || affidavitRequest.issuerName || "",
    issuerIdCardNumber: affidavitRequest.issuerId?.idCardNumber || affidavitRequest.issuerIdCardNumber || "",
    issuerWalletAddress: affidavitRequest.issuerId?.walletAddress || affidavitRequest.issuerWalletAddress || "",
    sellerId: affidavitRequest.sellerId?._id?.toString() || affidavitRequest.sellerId || "",
    sellerName: affidavitRequest.sellerId?.name || affidavitRequest.sellerName || "",
    sellerIdCardNumber: affidavitRequest.sellerId?.idCardNumber || affidavitRequest.sellerIdCardNumber || "",
    sellerWalletAddress: affidavitRequest.sellerId?.walletAddress || affidavitRequest.sellerWalletAddress || "",
    buyerId: affidavitRequest.buyerId?._id?.toString() || affidavitRequest.buyerId || "",
    buyerName: affidavitRequest.buyerId?.name || affidavitRequest.buyerName || "",
    buyerIdCardNumber: affidavitRequest.buyerId?.idCardNumber || affidavitRequest.buyerIdCardNumber || "",
    buyerWalletAddress: affidavitRequest.buyerId?.walletAddress || affidavitRequest.buyerWalletAddress || "",
    witnesses: (affidavitRequest.witnesses || []).map((w: any) => ({
      contactId: w.contactId?._id?.toString() || w.contactId || "",
      name: w.contactId?.name || w.name || "",
      idCardNumber: w.contactId?.idCardNumber || w.idCardNumber || "",
      walletAddress: w.contactId?.walletAddress || w.walletAddress || "",
    })),
    documents: affidavitRequest.documents || [],
    status: "Active",
    dateRequested: affidavitRequest.createdAt || affidavitRequest.dateRequested || new Date().toISOString(),
    dateIssued: new Date().toISOString(),
    requestId: affidavitRequest._id?.toString() || affidavitRequest.requestId || "",
    createdBy: affidavitRequest.createdBy?._id?.toString() || affidavitRequest.createdBy || "",
  }
}
