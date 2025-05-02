import mongoose, { Schema } from "mongoose"

const witnessSchema = new Schema({
  contactId: { type: Schema.Types.ObjectId, ref: "User" },
  name: { type: String },
  idCardNumber: { type: String },
  hasAccepted: { type: Boolean, default: false },
})

const documentSchema = new Schema({
  url: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
})

const affidavitRequestSchema = new Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    stampValue: { type: String, required: true },
    issuerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    issuerIdCardNumber: { type: String, required: true },
    issuerAccepted: { type: Boolean, default: false }, // New field for issuer acceptance
    description: { type: String, required: true },
    declaration: { type: String, required: true },
    userRole: { type: String, required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User" },
    sellerIdCardNumber: { type: String },
    sellerAccepted: { type: Boolean, default: false },
    buyerId: { type: Schema.Types.ObjectId, ref: "User" },
    buyerIdCardNumber: { type: String },
    buyerAccepted: { type: Boolean, default: false },
    witnesses: [witnessSchema],
    documents: [documentSchema],
    details: { type: Schema.Types.Mixed },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    initiatorIdCardNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
)

export default mongoose.models.AffidavitRequest || mongoose.model("AffidavitRequest", affidavitRequestSchema)