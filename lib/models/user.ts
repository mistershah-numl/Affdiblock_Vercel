import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [8, "Password should be at least 8 characters long"],
    },
    idCardNumber: {
      type: String,
      required: [true, "Please provide an ID card number"],
      unique: true,
      trim: true,
    },
    idCardFrontUrl: {
      type: String,
      required: [true, "Please provide ID card front image"],
    },
    idCardBackUrl: {
      type: String,
      required: [true, "Please provide ID card back image"],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?\d{10,15}$/, "Please provide a valid phone number"],
    },
    address: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    walletAddress: {
      type: String,
      trim: true,
      match: [/^0x[a-fA-F0-9]{40}$/, "Please provide a valid Ethereum address"],
      sparse: true,
    },
    role: {
      type: String,
      enum: ["Admin", "Issuer", "User"],
      default: "User",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending", "Banned"],
      default: "Active",
    },
    avatar: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next()
  }
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.models.User || mongoose.model("User", UserSchema)