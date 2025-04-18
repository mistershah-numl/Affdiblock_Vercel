"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, User } from "lucide-react"
import { createUser } from "@/lib/api/users"
import DashboardLayout from "@/components/dashboard-layout"

export default function CreateUserPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "User",
    idCardNumber: "",
    address: "",
    phone: "",
    walletAddress: "",
  })

  // File uploads
  const [idCardFront, setIdCardFront] = useState<File | null>(null)
  const [idCardBack, setIdCardBack] = useState<File | null>(null)
  const [licenseDocument, setLicenseDocument] = useState<File | null>(null)

  // Preview URLs
  const [idCardFrontPreview, setIdCardFrontPreview] = useState("")
  const [idCardBackPreview, setIdCardBackPreview] = useState("")
  const [licenseDocumentPreview, setLicenseDocumentPreview] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onload = (event) => {
        if (event.target) {
          const previewUrl = event.target.result as string

          if (fileType === "idCardFront") {
            setIdCardFront(file)
            setIdCardFrontPreview(previewUrl)
          } else if (fileType === "idCardBack") {
            setIdCardBack(file)
            setIdCardBackPreview(previewUrl)
          } else if (fileType === "licenseDocument") {
            setLicenseDocument(file)
            setLicenseDocumentPreview(previewUrl)
          }
        }
      }

      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // In a real app, you would upload the files to a storage service
      // and get back URLs to store in the database
      const userData = {
        ...formData,
        idCardFrontUrl: idCardFrontPreview || "/placeholder.svg?height=200&width=320&text=ID+Card+Front",
        idCardBackUrl: idCardBackPreview || "/placeholder.svg?height=200&width=320&text=ID+Card+Back",
        licenseDocumentUrl: licenseDocumentPreview || "/placeholder.svg?height=200&width=640&text=License+Document",
      }

      const response = await createUser(userData)

      if (response.success) {
        // Navigate to the newly created user's page
        router.push(`/dashboard/users/${response.user._id}`)
      } else {
        // Handle error
        console.error("Failed to create user:", response.error)
        alert("Failed to create user: " + response.error)
      }
    } catch (error) {
      console.error("Error creating user:", error)
      alert("An error occurred while creating the user")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/users")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold">Create New User</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the user's basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">User Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Issuer">Issuer</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Enter the user's contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="idCardNumber">ID Card Number *</Label>
                  <Input
                    id="idCardNumber"
                    name="idCardNumber"
                    placeholder="Enter ID card number"
                    value={formData.idCardNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                {formData.role !== "Admin" && (
                  <div className="space-y-2">
                    <Label htmlFor="walletAddress">Wallet Address</Label>
                    <Input
                      id="walletAddress"
                      name="walletAddress"
                      placeholder="Enter blockchain wallet address"
                      value={formData.walletAddress}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ID Documents */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Identification Documents</CardTitle>
                <CardDescription>Upload the user's identification documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label>ID Card (Front) *</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {idCardFrontPreview ? (
                        <div className="space-y-2">
                          <img
                            src={idCardFrontPreview || "/placeholder.svg"}
                            alt="ID Card Front Preview"
                            className="mx-auto max-h-40 object-contain"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIdCardFront(null)
                              setIdCardFrontPreview("")
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <User className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="text-sm text-gray-500">Click to upload or drag and drop</div>
                          <Button type="button" variant="outline" size="sm" asChild>
                            <label htmlFor="idCardFront" className="cursor-pointer">
                              <Upload className="mr-2 h-4 w-4" />
                              Upload ID Card Front
                              <input
                                id="idCardFront"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChange(e, "idCardFront")}
                                required={formData.role !== "Admin"}
                              />
                            </label>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>ID Card (Back) *</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {idCardBackPreview ? (
                        <div className="space-y-2">
                          <img
                            src={idCardBackPreview || "/placeholder.svg"}
                            alt="ID Card Back Preview"
                            className="mx-auto max-h-40 object-contain"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIdCardBack(null)
                              setIdCardBackPreview("")
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <User className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="text-sm text-gray-500">Click to upload or drag and drop</div>
                          <Button type="button" variant="outline" size="sm" asChild>
                            <label htmlFor="idCardBack" className="cursor-pointer">
                              <Upload className="mr-2 h-4 w-4" />
                              Upload ID Card Back
                              <input
                                id="idCardBack"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChange(e, "idCardBack")}
                                required={formData.role !== "Admin"}
                              />
                            </label>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {formData.role === "Issuer" && (
                  <div className="mt-6 space-y-4">
                    <Label>License Document *</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {licenseDocumentPreview ? (
                        <div className="space-y-2">
                          <img
                            src={licenseDocumentPreview || "/placeholder.svg"}
                            alt="License Document Preview"
                            className="mx-auto max-h-40 object-contain"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLicenseDocument(null)
                              setLicenseDocumentPreview("")
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <Upload className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="text-sm text-gray-500">Click to upload or drag and drop</div>
                          <Button type="button" variant="outline" size="sm" asChild>
                            <label htmlFor="licenseDocument" className="cursor-pointer">
                              <Upload className="mr-2 h-4 w-4" />
                              Upload License Document
                              <input
                                id="licenseDocument"
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => handleFileChange(e, "licenseDocument")}
                                required={formData.role === "Issuer"}
                              />
                            </label>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/users")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
