import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  idCardNumber?: string;
  address?: string;
  bio?: string;
  walletAddress?: string;
  walletConnectedAt?: Date;
  network?: string;
  language: string;
  timezone: string;
  sessionTimeout: number;
  avatar?: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  status: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    phone: { type: String },
    idCardNumber: { type: String },
    address: { type: String },
    bio: { type: String },
    walletAddress: { type: String },
    walletConnectedAt: { type: Date },
    network: { type: String },
    language: { type: String, default: "english" },
    timezone: { type: String, default: "UTC+0" },
    sessionTimeout: { type: Number, default: 30 },
    avatar: { type: String },
    idCardFrontUrl: { type: String },
    idCardBackUrl: { type: String },
    status: { type: String, default: "Active" },
    role: { type: String, default: "User" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(8);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);