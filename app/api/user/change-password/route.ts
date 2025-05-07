import { NextResponse } from "next/server"
import { headers } from "next/headers"
import {dbConnect} from "@/lib/db"
import User from "@/lib/models/user"
import { verifyToken } from "@/lib/api/auth"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    // Get authorization header
    const headersList = await headers()
    const authorization = headersList.get("Authorization")

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authorization.split(" ")[1]
    const tokenResult = verifyToken(token)

    if (!tokenResult.success || !tokenResult.decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Current password and new password are required" },
        { status: 400 }
      )
    }

    // Validate new password requirements
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 8 characters long" },
        { status: 400 }
      )
    }
    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: "New password must contain at least one uppercase letter" },
        { status: 400 }
      )
    }
    if (!/\d/.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: "New password must contain at least one number" },
        { status: 400 }
      )
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: "New password must contain at least one special character" },
        { status: 400 }
      )
    }

    // Connect to database
    await dbConnect()

    // Find user by ID
    const user = await User.findById(tokenResult.decoded.id).select("+password")

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword)
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 401 })
    }

    // Check if new password is the same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, error: "New password cannot be the same as the current password" },
        { status: 400 }
      )
    }

    // Validate new password does not contain name parts
    const nameParts = user.name.toLowerCase().split(" ")
    for (const part of nameParts) {
      if (part.length > 2 && newPassword.toLowerCase().includes(part)) {
        return NextResponse.json(
          { success: false, error: "New password cannot contain parts of your name" },
          { status: 400 }
        )
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const newHashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password directly to avoid pre("save") hook
    const updateResult = await User.updateOne(
      { _id: user._id },
      { $set: { password: newHashedPassword } }
    )

    if (updateResult.modifiedCount !== 1) {
      console.error("Failed to update password for user:", user.email)
      return NextResponse.json({ success: false, error: "Failed to update password" }, { status: 500 })
    }

    // Verify the saved password
    const savedUser = await User.findById(user._id).select("+password")
    const isNewPasswordValid = await savedUser.comparePassword(newPassword)

    if (!isNewPasswordValid) {
      console.error("Password verification failed after save for user:", user.email)
      return NextResponse.json({ success: false, error: "Failed to verify updated password" }, { status: 500 })
    }

    // Return success response with instruction to re-login
    return NextResponse.json({
      success: true,
      message: "Password updated successfully. Please log in again with your new password.",
    })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}