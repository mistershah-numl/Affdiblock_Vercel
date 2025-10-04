import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

console.log("Loading User model schema...");

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
  roles: string[];
  activeRole: string;
  remarks?: string;
  licenseUrl?: string;
  organization?: string;
  city?: string;
  designation?: string;
  dateOfJoining?: Date;
  added_by?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
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
    roles: { type: [String], default: ["User"] },
    activeRole: { type: String, default: "User" },
    remarks: { type: String },
    licenseUrl: { type: String },
    organization: { type: String },
    city: { type: String },
    designation: { type: String },
    dateOfJoining: { type: Date },
    added_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(8);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Ensure roles and activeRole are set correctly
userSchema.pre("save", function (next) {
  console.log("Pre-save hook: Ensuring roles and activeRole for user:", this.email);
  if (!this.roles || this.roles.length === 0) {
    this.roles = ["User"];
  }
  if (!this.activeRole) {
    this.activeRole = "User";
  }
  // Clear remarks if user is not banned
  if (this.status !== "Banned") {
    this.remarks = undefined;
  }
  // Clear issuer-specific fields if user does not have Issuer role
  if (!this.roles.includes("Issuer")) {
    this.licenseUrl = undefined;
    this.organization = undefined;
    this.city = undefined;
    this.designation = undefined;
    this.dateOfJoining = undefined;
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;

//earlier 109 lines working , without addedby then 109 with addedby