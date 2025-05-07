import mongoose, { Schema } from "mongoose"

const AffidavitSchema = new Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  stampValue: { type: String, required: true },
  issuerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  issuerIdCardNumber: { type: String, required: true }, // For search
  description: { type: String, required: true },
  declaration: { type: String, required: true },
  userRole: { type: String, enum: ["Seller", "Buyer"], required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  sellerIdCardNumber: { type: String, required: false }, // For search
  buyerId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  buyerIdCardNumber: { type: String, required: false }, // For search
  witnesses: [
    {
      contactId: { type: Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
      idCardNumber: { type: String }, // For search
    },
  ],
  documents: [
    {
      url: { type: String },
      name: { type: String },
      type: { type: String },
    },
  ],
  details: { type: Schema.Types.Mixed }, // For dynamic fields (e.g., car details, property details)
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const Affidavit =
  mongoose.models.Affidavit || mongoose.model("Affidavit", AffidavitSchema)

export default Affidavit