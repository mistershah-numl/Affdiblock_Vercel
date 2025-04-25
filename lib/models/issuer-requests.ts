import mongoose, { Schema, Document } from "mongoose"

interface IIssuerRequest extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  email: string
  idCardNumber?: string
  status: string
  reason?: string
  adminResponse?: string
  createdAt: Date
  updatedAt: Date
}

const IssuerRequestSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    idCardNumber: { type: String },
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Approved", "Rejected"],
    },
    reason: { type: String },
    adminResponse: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export default mongoose.models.IssuerRequest || mongoose.model<IIssuerRequest>("IssuerRequest", IssuerRequestSchema)