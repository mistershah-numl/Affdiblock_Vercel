// MongoDB Issuer Application Model

export interface IssuerApplication {
  _id: string
  userId: string // Reference to User
  licenseNumber: string
  organization: string
  experience: string
  city: string
  address: string
  licenseDocumentUrl: string // URL to the stored PDF
  certificatesUrl?: string // URL to the stored PDF
  otherDocumentsUrl?: string // URL to the stored PDF
  status: "Pending" | "Approved" | "Rejected"
  reviewedBy?: string // Reference to Admin User who reviewed the application
  reviewNotes?: string
  createdAt: Date
  updatedAt: Date
}

// MongoDB Schema (for reference)
/*
const IssuerApplicationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  licenseNumber: { type: String, required: true },
  organization: { type: String, required: true },
  experience: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  licenseDocumentUrl: { type: String, required: true },
  certificatesUrl: { type: String },
  otherDocumentsUrl: { type: String },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
*/
