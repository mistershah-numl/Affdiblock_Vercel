// MongoDB Affidavit Model

export interface Affidavit {
  _id: string
  title: string
  category: string
  issuerId: string // Reference to User with role "Issuer"
  userId: string // Reference to User who requested the affidavit
  dateRequested: Date
  dateIssued: Date | null
  status: "Active" | "Pending" | "Rejected" | "Revoked"
  parties: {
    role: string
    userId: string // Reference to User
  }[]
  witnesses: {
    userId: string // Reference to User
  }[]
  description: string
  declaration: string
  blockchainDetails: {
    transactionHash: string
    blockNumber: number
    timestamp: string
  } | null
  // Category-specific fields
  propertyDetails?: {
    address: string
    size: string
  }
  vehicleDetails?: {
    model: string
    registrationNumber: string
    chassisNumber: string
  }
  businessDetails?: {
    businessName: string
    businessType: string
  }
  createdAt: Date
  updatedAt: Date
}

// MongoDB Schema (for reference)
/*
const AffidavitSchema = new Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  issuerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dateRequested: { type: Date, default: Date.now },
  dateIssued: { type: Date, default: null },
  status: { type: String, enum: ["Active", "Pending", "Rejected", "Revoked"], default: "Pending" },
  parties: [{
    role: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  witnesses: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  description: { type: String, required: true },
  declaration: { type: String, required: true },
  blockchainDetails: {
    transactionHash: { type: String },
    blockNumber: { type: Number },
    timestamp: { type: String }
  },
  propertyDetails: {
    address: { type: String },
    size: { type: String }
  },
  vehicleDetails: {
    model: { type: String },
    registrationNumber: { type: String },
    chassisNumber: { type: String }
  },
  businessDetails: {
    businessName: { type: String },
    businessType: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
*/
