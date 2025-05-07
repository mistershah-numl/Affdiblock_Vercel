import jwt from "jsonwebtoken"
import mongoose, { Schema, Document } from "mongoose"
import {dbConnect} from "@/lib/db"

const JWT_SECRET = process.env.JWT_SECRET || "AFFIDBLOCK"

interface TokenPayload {
  id: string
  email: string
  roles: string[]
  activeRole: string
}

interface IIssuerRequest extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  email: string
  licenseNumber: string
  organization: string
  city: string
  address: string
  licenseDocumentUrl: string
  status: string
  reviewedBy?: string
  reviewNotes?: string
  reviewedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const IssuerRequestSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    organization: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    licenseDocumentUrl: { type: String, required: true },
    status: { type: String, default: "Pending" },
    reviewedBy: { type: String },
    reviewNotes: { type: String },
    reviewedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

const IssuerRequestModel = mongoose.models.IssuerRequest || mongoose.model<IIssuerRequest>("IssuerRequest", IssuerRequestSchema)

// Request to become an issuer
export async function requestIssuerRole(userId: string, issuerData: any) {
  try {
    await dbConnect()

    const existingRequest = await IssuerRequestModel.findOne({ userId, status: "Pending" })
    if (existingRequest) {
      return { success: false, error: "You already have a pending issuer request" }
    }

    const issuerRequest = new IssuerRequestModel({
      userId,
      ...issuerData,
      status: "Pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await issuerRequest.save()
    return { success: true, issuerRequest }
  } catch (error) {
    console.error("Issuer request error:", error)
    return { success: false, error: "Failed to submit issuer request" }
  }
}

// Verify JWT token
export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return { success: true, decoded }
  } catch (error) {
    console.error("Token verification error:", error)
    return { success: false, decoded: null }
  }
}

// Get all issuer requests (for admins)
export async function getIssuerRequests() {
  try {
    await dbConnect()
    const requests = await IssuerRequestModel.find().lean()
    return { success: true, requests }
  } catch (error) {
    console.error("Get issuer requests error:", error)
    return { success: false, error: "Failed to get issuer requests" }
  }
}

// Approve issuer request (for admins)
export async function approveIssuerRequest(requestId: string, adminId: string) {
  try {
    await dbConnect()
    const request = await IssuerRequestModel.findById(requestId)
    if (!request) {
      return { success: false, error: "Issuer request not found" }
    }

    const user = await mongoose.model("User").findById(request.userId)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    if (!user.roles.includes("Issuer")) {
      user.roles.push("Issuer")
      await user.save()
    }

    request.status = "Approved"
    request.reviewedBy = adminId
    request.reviewedAt = new Date()
    await request.save()

    return { success: true, request }
  } catch (error) {
    console.error("Approve issuer request error:", error)
    return { success: false, error: "Failed to approve issuer request" }
  }
}

// Reject issuer request (for admins)
export async function rejectIssuerRequest(requestId: string, adminId: string, reason: string) {
  try {
    await dbConnect()
    const request = await IssuerRequestModel.findById(requestId)
    if (!request) {
      return { success: false, error: "Issuer request not found" }
    }

    request.status = "Rejected"
    request.reviewedBy = adminId
    request.reviewNotes = reason
    request.reviewedAt = new Date()
    await request.save()

    return { success: true, request }
  } catch (error) {
    console.error("Reject issuer request error:", error)
    return { success: false, error: "Failed to reject issuer request" }
  }
}