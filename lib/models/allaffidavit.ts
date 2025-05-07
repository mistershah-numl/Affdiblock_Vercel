import mongoose, { Schema, Document, Model } from "mongoose";

interface IAffidavit extends Document {
  affidavitId: string;
  displayId?: string;  // Added for consistency with Affidavit
  title: string;
  category: string;
  issuerId: string;
  issuerName: string;
  issuerArea: string;
  issuerIdCardNumber: string;
  issuerWalletAddress?: string;  // Added for consistency with Affidavit
  dateIssued: Date | null;
  dateRequested?: Date;  // Added for consistency with Affidavit
  status: string;
  parties: Array<{
    role: string;
    name: string;
    idCardNumber: string;
    userId: string;
  }>;
  witnesses: Array<{
    name: string;
    idCardNumber: string;
    userId: string;
  }>;
  description: string;
  declaration: string;
  documents: Array<{
    name: string;
    type: string;
    ipfsHash: string;
    url?: string;  // Added for consistency with Affidavit
  }>;
  blockchainHash?: string;
  blockchainBlockNumber?: number;
  createdBy?: string;  // Added for consistency with Affidavit
  requestId?: string;  // Added for consistency with Affidavit
  createdAt: Date;
  updatedAt: Date;
}

const affidavitSchema: Schema<IAffidavit> = new Schema(
  {
    affidavitId: { type: String, required: true, unique: true },
    displayId: { type: String },  // Optional
    title: { type: String, required: true },
    category: { type: String, required: true },
    issuerId: { type: String, required: true },
    issuerName: { type: String, required: true },
    issuerArea: { type: String },
    issuerIdCardNumber: { type: String, required: true },
    issuerWalletAddress: { type: String },  // Optional
    dateIssued: { type: Date, default: null },
    dateRequested: { type: Date },  // Optional
    status: { type: String, default: "pending" },
    parties: [{
      role: { type: String, required: true },
      name: { type: String, required: true },
      idCardNumber: { type: String, required: true },
      userId: { type: String, required: true },
    }],
    witnesses: [{
      name: { type: String, required: true },
      idCardNumber: { type: String, required: true },
      userId: { type: String, required: true },
    }],
    description: { type: String, required: true },
    declaration: { type: String, required: true },
    documents: [{
      name: { type: String, required: true },
      type: { type: String, required: true },
      ipfsHash: { type: String, required: true },
      url: { type: String },  // Optional
    }],
    blockchainHash: { type: String },
    blockchainBlockNumber: { type: Number },
    createdBy: { type: String },  // Optional
    requestId: { type: String },  // Optional
  },
  { timestamps: true }
);

const AllAffidavit: Model<IAffidavit> = mongoose.models.AllAffidavit || mongoose.model<IAffidavit>("AllAffidavit", affidavitSchema);

export default AllAffidavit;