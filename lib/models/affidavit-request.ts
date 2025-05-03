import mongoose from "mongoose"

const witnessSchema = new mongoose.Schema({
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hasAccepted: { type: Boolean, default: null },
})

const documentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
})

const affidavitRequestSchema = new mongoose.Schema({
  displayId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  stampValue: { type: String, required: true },
  issuerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  issuerIdCardNumber: { type: String, required: true },
  issuerAccepted: { type: Boolean, default: null },
  description: { type: String, required: true },
  declaration: { type: String, required: true },
  userRole: { type: String, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sellerIdCardNumber: { type: String },
  sellerAccepted: { type: Boolean, default: null },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  buyerIdCardNumber: { type: String },
  buyerAccepted: { type: Boolean, default: null },
  witnesses: [witnessSchema],
  documents: [documentSchema],
  details: { type: Map, of: mongoose.Schema.Types.Mixed },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  initiatorIdCardNumber: { type: String, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const AffidavitRequest = mongoose.models.AffidavitRequest || mongoose.model("AffidavitRequest", affidavitRequestSchema)

export default AffidavitRequest