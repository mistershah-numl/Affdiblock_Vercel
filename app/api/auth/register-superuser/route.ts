import { NextResponse } from "next/server"
import {dbConnect} from "@/lib/db"
import User from "@/lib/models/user"

export async function POST() {
  try {
    await dbConnect()

    // Check if the superuser already exists
    const existingUser = await User.findOne({ email: "dummy@dummy.com" })
    if (existingUser) {
      return NextResponse.json({ success: false, error: "dummy already exists" }, { status: 400 })
    }

    // Create the superuser
    const user = new User({
      name: "Dummy",
      email: "dummy@dummy.com",
      password: "Dumy123?",
      idCardNumber: "1264567890123",
      idCardFrontUrl: "https://example.com/dummy-id-front.jpg", // Dummy URL
      idCardBackUrl: "https://example.com/dummy-id-back.jpg",  // Dummy URL
      language: "english",
      timezone: "UTC+0",
      sessionTimeout: 30,
      status: "Active",
      roles: ["Issuer","Admin"],
      activeRole: "Issuer",
    })

    console.log("Dummy object before saving:", user.toObject())

    await user.save()

    console.log("Dummy saved to database:", await User.findOne({ email: "dummy@dummy.com" }))

    return NextResponse.json({
      success: true,
      message: "Dummy created successfully. Please log in with email: superuser@super.com and passwordord: Dumy123??",
    })
  } catch (error) {
    console.error("Error creating Dymmy:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
