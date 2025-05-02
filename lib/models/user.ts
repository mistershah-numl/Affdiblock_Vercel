import mongoose, { Schema, Document } from "mongoose";
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
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const userSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
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
    role: { type: String, select: false, default: undefined }, // Explicitly exclude old `role` field
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  const user = this as IUser;
  if (!user.isModified("password")) return next();
  const salt = await bcrypt.genSalt(8);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

// Ensure roles and activeRole are set correctly, and remove role field
userSchema.pre("save", function (next) {
  const user = this as IUser;
  console.log("Pre-save hook: Ensuring roles and activeRole for user:", user.email);
  if (!user.roles || user.roles.length === 0) {
    user.roles = ["User"];
  }
  if (!user.activeRole) {
    user.activeRole = "User";
  }
  if (user.role) {
    console.log("Pre-save hook: Removing old 'role' field for user:", user.email);
    user.role = undefined;
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  const user = this as IUser;
  return bcrypt.compare(candidatePassword, user.password);
};

export default mongoose.models.User || mongoose.model<IUser>("User", userSchema);
