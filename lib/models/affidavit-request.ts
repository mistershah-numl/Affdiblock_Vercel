import mongoose, { Schema } from "mongoose"

const AffidavitRequestSchema = new Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  stampValue: { type: String, required: true },
  issuerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  issuerIdCardNumber: { type: String, required: true },
  description: { type: String, required: true },
  declaration: { type: String, required: true },
  userRole: { type: String, enum: ["Seller", "Buyer"], required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  sellerIdCardNumber: { type: String, required: false },
  sellerAccepted: { type: Boolean, default: false },
  buyerId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  buyerIdCardNumber: { type: String, required: false },
  buyerAccepted: { type: Boolean, default: false },
  witnesses: [
    {
      contactId: { type: Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
      idCardNumber: { type: String },
      hasAccepted: { type: Boolean, default: false },
    },
  ],
  documents: [
    {
      url: { type: String },
      name: { type: String },
      type: { type: String },
    },
  ],
  details: { type: Schema.Types.Mixed },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  initiatorIdCardNumber: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const AffidavitRequest =
  mongoose.models.AffidavitRequest || mongoose.model("AffidavitRequest", AffidavitRequestSchema)

export default AffidavitRequest