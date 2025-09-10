import mongoose, { Schema, type Document, type Model } from "mongoose";
import "./user"; // Import User model to ensure it is registered first

export interface IAffidavit extends Document {
  displayId: string;
  title: string;
  category: string;
  description: string;
  declaration: string;
  issuerId: mongoose.Types.ObjectId;
  issuerName: string;
  issuerIdCardNumber: string;
  issuerWalletAddress?: string;
  sellerId?: mongoose.Types.ObjectId;
  sellerName?: string;
  sellerIdCardNumber?: string;
  sellerWalletAddress?: string;
  buyerId?: mongoose.Types.ObjectId;
  buyerName?: string;
  buyerIdCardNumber?: string;
  buyerWalletAddress?: string;
  witnesses?: Array<{
    contactId: mongoose.Types.ObjectId;
    name: string;
    idCardNumber: string;
    walletAddress?: string;
  }>;
  documents?: Array<{
    url: string;
    name: string;
    type: string;
    ipfsHash?: string;
  }>;
  details: Record<string, any>;
  status: string;
  dateRequested: Date;
  dateIssued: Date;
  requestId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  transactionHash?: string;
  blockNumber?: number;
  dataHash?: string;
  isVerifiedOnBlockchain?: boolean;
  lastVerifiedAt?: Date;
}

const affidavitSchema: Schema<IAffidavit> = new Schema(
  {
    displayId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    declaration: { type: String, required: true },
    issuerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    issuerName: { type: String, required: true },
    issuerIdCardNumber: { type: String, required: true },
    issuerWalletAddress: { type: String, required: false },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    sellerName: { type: String, required: false },
    sellerIdCardNumber: { type: String, required: false },
    sellerWalletAddress: { type: String, required: false },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    buyerName: { type: String, required: false },
    buyerIdCardNumber: { type: String, required: false },
    buyerWalletAddress: { type: String, required: false },
    witnesses: [
      {
        contactId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        idCardNumber: { type: String, required: true },
        walletAddress: { type: String, required: false },
      },
    ],
    documents: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
        ipfsHash: { type: String, required: false },
      },
    ],
    details: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Accepted", "Revoked", "Rejected"],
      default: "Active",
    },
    dateRequested: { type: Date, required: true },
    dateIssued: { type: Date, required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "AffidavitRequest", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    transactionHash: { type: String, required: false },
    blockNumber: { type: Number, required: false },
    dataHash: { type: String, required: false },
    isVerifiedOnBlockchain: { type: Boolean, default: false },
    lastVerifiedAt: { type: Date, required: false },
  },
  { timestamps: true }
);

affidavitSchema.statics.generateDisplayId = async function () {
  const currentYear = new Date().getFullYear();
  const latestAffidavit = await this.findOne({ displayId: new RegExp(`AFF-${currentYear}-`) })
    .sort({ displayId: -1 })
    .lean();

  let nextNumber = 1;
  if (latestAffidavit) {
    const parts = latestAffidavit.displayId.split("-");
    if (parts.length === 3) {
      nextNumber = Number.parseInt(parts[2]) + 1;
    }
  }

  return `AFF-${currentYear}-${nextNumber.toString().padStart(5, "0")}`;
};

const Affidavit: Model<IAffidavit> & { generateDisplayId: () => Promise<string> } =
  (mongoose.models.Affidavit as any) ||
  mongoose.model<IAffidavit, Model<IAffidavit> & { generateDisplayId: () => Promise<string> }>(
    "Affidavit",
    affidavitSchema
  );

export default Affidavit;