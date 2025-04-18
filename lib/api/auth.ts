import jwt from "jsonwebtoken"
import type { User } from "@/lib/models/user"

const JWT_SECRET = process.env.JWT_SECRET || "AFFIDBLOCK"

interface TokenPayload {
  id: string
  email: string
  role: string
}

// Request to become an issuer
export async function requestIssuerRole(userId: string, issuerData: any) {
  try {
    const issuerRequest = {
      _id: `req_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...issuerData,
      status: "Pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    return { success: true, issuerRequest }
  } catch (error) {
    console.error("Issuer request error:", error)
    return { success: false, error: "Failed to submit issuer request" }
  }
}

// Verify JWT token
export function verifyToken(token: string): { success: boolean; decoded?: TokenPayload } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return { success: true, decoded }
  } catch (error) {
    console.error("Token verification error:", error)
    return { success: false }
  }
}