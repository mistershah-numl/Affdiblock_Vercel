import jwt from "jsonwebtoken"
import IssuerRequest from "@/lib/models/issuer-requests"
import User from "@/lib/models/user"

interface TokenResult {
  success: boolean
  decoded?: { id: string }
  error?: string
}

export function verifyToken(token: string): TokenResult {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      return { success: false, error: "JWT_SECRET is not configured" }
    }
    const decoded = jwt.verify(token, secret) as { id: string }
    return { success: true, decoded }
  } catch (error: any) {
    console.error("Token verification error:", error.message)
    return { success: false, error: "Invalid token" }
  }
}

interface ApproveRejectResult {
  success: boolean
  request?: any
  error?: string
}

export async function approveIssuerRequest(requestId: string, adminId: string): Promise<ApproveRejectResult> {
  try {
    const issuerRequest = await IssuerRequest.findById(requestId)
    if (!issuerRequest) {
      return { success: false, error: "Issuer request not found" }
    }

    if (issuerRequest.status !== "Pending") {
      return { success: false, error: "Request is not pending" }
    }

    issuerRequest.status = "Approved"
    await issuerRequest.save()

    const user = await User.findById(issuerRequest.userId)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    const updatedRoles = [...new Set([...user.roles, "Issuer", "User"])]
    user.roles = updatedRoles
    if (!updatedRoles.includes(user.activeRole)) {
      user.activeRole = "User"
    }

    user.licenseUrl = issuerRequest.licenseUrl
    user.organization = issuerRequest.organization
    user.city = issuerRequest.city
    user.designation = issuerRequest.designation
    user.dateOfJoining = issuerRequest.dateOfJoining

    await user.save()

    return {
      success: true,
      request: {
        _id: issuerRequest._id,
        status: issuerRequest.status,
        updatedAt: issuerRequest.updatedAt,
      },
    }
  } catch (error: any) {
    console.error("Error approving issuer request:", error.message)
    return { success: false, error: "Failed to approve issuer request" }
  }
}

export async function rejectIssuerRequest(requestId: string, adminId: string, remarks: string): Promise<ApproveRejectResult> {
  try {
    const issuerRequest = await IssuerRequest.findById(requestId)
    if (!issuerRequest) {
      return { success: false, error: "Issuer request not found" }
    }

    if (issuerRequest.status !== "Pending") {
      return { success: false, error: "Request is not pending" }
    }

    issuerRequest.status = "Rejected"
    issuerRequest.remarks = remarks || "No reason provided"
    await issuerRequest.save()

    return {
      success: true,
      request: {
        _id: issuerRequest._id,
        status: issuerRequest.status,
        remarks: issuerRequest.remarks,
        updatedAt: issuerRequest.updatedAt,
      },
    }
  } catch (error: any) {
    console.error("Error rejecting issuer request:", error.message)
    return { success: false, error: "Failed to reject issuer request" }
  }
}