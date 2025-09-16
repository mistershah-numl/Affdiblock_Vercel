import mongoose, { Schema, Document } from "mongoose";

export interface IIssuerRequest extends Document {
  userId: mongoose.Types.ObjectId;
  licenseUrl: string;
  organization: string;
  city: string;
  designation: string;
  dateOfJoining: Date;
  status: "Pending" | "Approved" | "Rejected";
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IssuerRequestSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    licenseUrl: { type: String, required: true },
    organization: { type: String, required: true },
    city: { type: String, required: true },
    designation: { type: String, required: true },
    dateOfJoining: { type: Date, required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    remarks: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { 
    timestamps: true,
    collection: "issuer_requests"  // Unique collection name to avoid caching conflicts
  }
);

export default mongoose.models.IssuerRequest || mongoose.model<IIssuerRequest>("IssuerRequest", IssuerRequestSchema);