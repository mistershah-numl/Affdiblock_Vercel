import crypto from "crypto"

// Simple interface for core affidavit data only
interface CoreAffidavitData {
  displayId: string
  title: string
  category: string
  description: string
  declaration: string
  issuerIdCardNumber: string
  sellerIdCardNumber: string
  buyerIdCardNumber: string
}

export function generateAffidavitHash(data: any): string {
  // Extract only the core fields you specified
  const coreData: CoreAffidavitData = {
    displayId: String(data.displayId || "").trim(),
    title: String(data.title || "").trim(),
    category: String(data.category || "").trim(),
    description: String(data.description || "").trim(),
    declaration: String(data.declaration || "").trim(),
    // Only ID card numbers of buyer, seller, and issuer
    issuerIdCardNumber: extractIdCardNumber(data, "issuer"),
    sellerIdCardNumber: extractIdCardNumber(data, "seller"),
    buyerIdCardNumber: extractIdCardNumber(data, "buyer"),
  }

  // Create deterministic string by sorting keys
  const sortedKeys = Object.keys(coreData).sort()
  const dataString = sortedKeys.map((key) => `${key}:${coreData[key as keyof CoreAffidavitData]}`).join("|")

  // Generate SHA256 hash
  const hash = crypto.createHash("sha256").update(dataString).digest("hex")
  const hashWithPrefix = `0x${hash}`

  console.log("[v0] Hash Generation Debug:", {
    coreData,
    dataString,
    generatedHash: hashWithPrefix,
  })

  return hashWithPrefix
}

function extractIdCardNumber(data: any, role: "issuer" | "seller" | "buyer"): string {
  const roleId = `${role}Id`
  const roleIdCardNumber = `${role}IdCardNumber`

  // Try different ways to get the ID card number
  // 1. From nested object with idCardNumber property
  if (data[roleId] && typeof data[roleId] === "object" && data[roleId].idCardNumber) {
    return String(data[roleId].idCardNumber).trim()
  }

  // 2. From direct property
  if (data[roleIdCardNumber]) {
    return String(data[roleIdCardNumber]).trim()
  }

  // 3. From string ID (fallback for populated objects)
  if (data[roleId] && typeof data[roleId] === "string") {
    return String(data[roleId]).trim()
  }

  return ""
}

export function createAffidavitDataForHash(affidavit: any, overrideDisplayId?: string): any {
  console.log(
    "[v0] createAffidavitDataForHash input:",
    JSON.stringify(
      {
        displayId: affidavit.displayId,
        overrideDisplayId,
        title: affidavit.title,
        category: affidavit.category,
        description: affidavit.description,
        declaration: affidavit.declaration,
        issuerId: affidavit.issuerId,
        sellerId: affidavit.sellerId,
        buyerId: affidavit.buyerId,
      },
      null,
      2,
    ),
  )

  // Helper function to extract ID card number from various data structures
  const getIdCardNumber = (userObj: any, fallbackField?: string): string => {
    if (!userObj) return ""

    // If it's a populated object with idCardNumber
    if (typeof userObj === "object" && userObj.idCardNumber) {
      return String(userObj.idCardNumber).trim()
    }

    // If it's just a string ID
    if (typeof userObj === "string") {
      return fallbackField ? String(affidavit[fallbackField] || "").trim() : ""
    }

    return ""
  }

  const result = {
    displayId: overrideDisplayId || affidavit.displayId || "",
    title: affidavit.title || "",
    category: affidavit.category || "",
    description: affidavit.description || "",
    declaration: affidavit.declaration || "",
    issuerId: affidavit.issuerId,
    sellerId: affidavit.sellerId,
    buyerId: affidavit.buyerId,
    issuerIdCardNumber: getIdCardNumber(affidavit.issuerId, "issuerIdCardNumber"),
    sellerIdCardNumber: getIdCardNumber(affidavit.sellerId, "sellerIdCardNumber"),
    buyerIdCardNumber: getIdCardNumber(affidavit.buyerId, "buyerIdCardNumber"),
  }

  console.log("[v0] API affidavitDataForHash:", JSON.stringify(result, null, 2))

  return result
}
