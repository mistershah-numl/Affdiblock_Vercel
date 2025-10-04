"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, User, Eye, EyeOff, Lock, AlertCircle, Check, X, Mail } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

export default function CreateUserPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    idCardNumber: "",
    address: "",
    phone: "",
    organization: "",
    city: "",
    designation: "",
    dateOfJoining: "",
  })

  const [selectedRoles, setSelectedRoles] = useState({
    user: true,
    issuer: false,
    admin: false,
  })

  const [formattedIdCardNumber, setFormattedIdCardNumber] = useState("")
  const [idCardFront, setIdCardFront] = useState<File | null>(null)
  const [idCardBack, setIdCardBack] = useState<File | null>(null)
  const [licenseDocument, setLicenseDocument] = useState<File | null>(null)

  const [idCardFrontPreview, setIdCardFrontPreview] = useState<string | null>(null)
  const [idCardBackPreview, setIdCardBackPreview] = useState<string | null>(null)
  const [licenseDocumentPreview, setLicenseDocumentPreview] = useState<string | null>(null)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  const [formErrors, setFormErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
    idCardNumber?: string
    idCardFront?: string
    idCardBack?: string
    organization?: string
    city?: string
    designation?: string
    dateOfJoining?: string
    license?: string
  }>({})

  const [error, setError] = useState<string | null>(null)

  const idCardFrontRef = useRef<HTMLInputElement>(null)
  const idCardBackRef = useRef<HTMLInputElement>(null)
  const licenseRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const formatIdCardNumber = (value: string) => {
      const numericValue = value.replace(/\D/g, "")
      if (numericValue.length <= 5) {
        return numericValue
      } else if (numericValue.length <= 12) {
        return `${numericValue.slice(0, 5)}-${numericValue.slice(5)}`
      } else {
        return `${numericValue.slice(0, 5)}-${numericValue.slice(5, 12)}-${numericValue.slice(12, 13)}`
      }
    }
    setFormattedIdCardNumber(formatIdCardNumber(formData.idCardNumber))
  }, [formData.idCardNumber])

  useEffect(() => {
    const errors: string[] = []
    let strength = 0
    if (formData.password) {
      if (formData.password.length >= 8) strength += 25
      else errors.push("Password must be at least 8 characters long")
      if (/[A-Z]/.test(formData.password)) strength += 25
      else errors.push("Password must contain at least one uppercase letter")
      if (/\d/.test(formData.password)) strength += 25
      else errors.push("Password must contain at least one number")
      if (/[^A-Za-z0-9]/.test(formData.password)) strength += 25
      else errors.push("Password must contain at least one special character")
      if (formData.name && formData.name.length > 2) {
        const nameParts = formData.name.toLowerCase().split(" ")
        for (const part of nameParts) {
          if (part.length > 2 && formData.password.toLowerCase().includes(part)) {
            errors.push("Password cannot contain parts of your name")
            strength = Math.max(0, strength - 25)
            break
          }
        }
      }
    }
    setPasswordStrength(strength)
    setPasswordErrors(errors)
  }, [formData.password, formData.name])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (role: keyof typeof selectedRoles) => {
    if (role === "user") return // Cannot uncheck User
    setSelectedRoles((prev) => ({ ...prev, [role]: !prev[role] }))
  }

  useEffect(() => {
    if (!selectedRoles.issuer) {
      setFormData((prev) => ({
        ...prev,
        organization: "",
        city: "",
        designation: "",
        dateOfJoining: "",
      }))
      setLicenseDocument(null)
      setLicenseDocumentPreview(null)
    }
  }, [selectedRoles.issuer])

  const handleIdCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 13)
    setFormData((prev) => ({ ...prev, idCardNumber: value }))
  }

  const handleIdCardFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB")
        return
      }
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file")
        return
      }
      setIdCardFront(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setIdCardFrontPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleIdCardBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB")
        return
      }
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file")
        return
      }
      setIdCardBack(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setIdCardBackPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
      if (!allowedTypes.includes(file.type)) {
        alert("License document must be JPEG, PNG, GIF, WebP, or PDF")
        return
      }
      setLicenseDocument(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setLicenseDocumentPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const roles = Object.keys(selectedRoles).filter(role => selectedRoles[role as keyof typeof selectedRoles])
    const errors: {
      name?: string
      email?: string
      password?: string
      confirmPassword?: string
      idCardNumber?: string
      idCardFront?: string
      idCardBack?: string
      organization?: string
      city?: string
      designation?: string
      dateOfJoining?: string
      license?: string
    } = {}
    if (!formData.name.trim()) errors.name = "Full name is required"
    if (!formData.email.trim()) errors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email is invalid"
    if (!formData.password) errors.password = "Password is required"
    else if (passwordErrors.length > 0) errors.password = "Password does not meet requirements"
    if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your password"
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match"
    if (!roles.includes("Admin")) {
      if (!formData.idCardNumber) errors.idCardNumber = "ID card number is required"
      else if (formData.idCardNumber.replace(/\D/g, "").length !== 13) errors.idCardNumber = "ID card number must be 13 digits"
      if (!idCardFront) errors.idCardFront = "ID card front image is required"
      if (!idCardBack) errors.idCardBack = "ID card back image is required"
    }
    if (roles.includes("Issuer")) {
      if (!formData.organization.trim()) errors.organization = "Organization is required"
      if (!formData.city.trim()) errors.city = "City is required"
      if (!formData.designation.trim()) errors.designation = "Designation is required"
      if (!formData.dateOfJoining) errors.dateOfJoining = "Date of joining is required"
      else if (isNaN(new Date(formData.dateOfJoining).getTime())) errors.dateOfJoining = "Invalid date of joining"
      if (!licenseDocument) errors.license = "License document is required"
    }
    setFormErrors(errors)
    setError(null)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    if (!token) {
      setError("Authentication token is missing. Please log in again.")
      return
    }
    setIsSubmitting(true)
    setError(null)

    try {
      const submitFormData = new FormData()
      // Append text fields only if non-empty
      Object.entries(formData).forEach(([key, value]) => {
        if (value && value.trim()) {
          submitFormData.append(key, value)
        }
      })

      // Append roles
      Object.entries(selectedRoles).forEach(([role, checked]) => {
        if (checked) {
          submitFormData.append("roles", role)
        }
      })

      // Append files
      if (idCardFront) submitFormData.append("idCardFront", idCardFront)
      if (idCardBack) submitFormData.append("idCardBack", idCardBack)
      if (licenseDocument) submitFormData.append("license", licenseDocument)

      const response = await fetch('/api/user/admin-create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: submitFormData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        router.push("/dashboard/users")
      } else {
        setError(data.error || "An unexpected error occurred")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      setError("An error occurred while creating the user")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "Very Weak"
    if (passwordStrength <= 25) return "Weak"
    if (passwordStrength <= 50) return "Medium"
    if (passwordStrength <= 75) return "Strong"
    return "Very Strong"
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-200 dark:bg-gray-700"
    if (passwordStrength <= 25) return "bg-red-500"
    if (passwordStrength <= 50) return "bg-orange-500"
    if (passwordStrength <= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const handleRemoveFile = (fileType: string) => {
    if (fileType === "idCardFront") {
      setIdCardFront(null)
      setIdCardFrontPreview(null)
    } else if (fileType === "idCardBack") {
      setIdCardBack(null)
      setIdCardBackPreview(null)
    } else if (fileType === "license") {
      setLicenseDocument(null)
      setLicenseDocumentPreview(null)
    }
  }

  const isAdminSelected = selectedRoles.admin
  const isIssuerSelected = selectedRoles.issuer

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Form Section */}
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
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={cn("pl-10", formErrors.name && "border-red-500 focus-visible:ring-red-500")}
                    disabled={isSubmitting}
                  />
                </div>
                {formErrors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {formErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={cn("pl-10", formErrors.email && "border-red-500 focus-visible:ring-red-500")}
                    disabled={isSubmitting}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {formErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={cn("pl-10", formErrors.password && "border-red-500 focus-visible:ring-red-500")}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Progress value={passwordStrength} className={cn("h-1", getPasswordStrengthColor())} />
                      <span className="text-xs ml-2">{getPasswordStrengthText()}</span>
                    </div>
                    <div className="space-y-1">
                      {passwordErrors.map((error, index) => (
                        <p key={index} className="text-xs flex items-center gap-1 text-amber-500 dark:text-amber-400">
                          <X className="h-3 w-3" /> {error}
                        </p>
                      ))}
                      {passwordStrength === 100 && (
                        <p className="text-xs flex items-center gap-1 text-green-500">
                          <Check className="h-3 w-3" /> Password meets all requirements
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {formErrors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {formErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={cn("pl-10", formErrors.confirmPassword && "border-red-500 focus-visible:ring-red-500")}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {formErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>User Roles *</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="user" checked={selectedRoles.user} disabled />
                    <Label htmlFor="user" className="text-sm font-medium">User (Default - Cannot be removed)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="issuer" 
                      checked={selectedRoles.issuer} 
                      onCheckedChange={() => handleRoleChange("issuer")}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="issuer" className="text-sm font-medium">Issuer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="admin" 
                      checked={selectedRoles.admin} 
                      onCheckedChange={() => handleRoleChange("admin")}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="admin" className="text-sm font-medium">Admin</Label>
                  </div>
                </div>
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
                <Label htmlFor="idCardNumber">ID Card Number {!isAdminSelected ? "*" : ""}</Label>
                <div className="relative">
                  <Input
                    id="idCardNumber"
                    placeholder="Enter 13 digit ID card number"
                    value={formData.idCardNumber}
                    onChange={handleIdCardNumberChange}
                    className={cn(formErrors.idCardNumber && "border-red-500 focus-visible:ring-red-500")}
                    disabled={isSubmitting}
                  />
                  {formattedIdCardNumber && (
                    <div className="absolute right-3 top-3 text-sm text-gray-500">Format: {formattedIdCardNumber}</div>
                  )}
                </div>
                {formErrors.idCardNumber && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {formErrors.idCardNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          {/* Organization Details (Issuer only) */}
          {isIssuerSelected && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Enter the issuer's organization information</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization *</Label>
                  <Input
                    id="organization"
                    name="organization"
                    placeholder="Enter organization name"
                    value={formData.organization}
                    onChange={handleInputChange}
                    className={cn(formErrors.organization && "border-red-500 focus-visible:ring-red-500")}
                    disabled={isSubmitting}
                  />
                  {formErrors.organization && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {formErrors.organization}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={cn(formErrors.city && "border-red-500 focus-visible:ring-red-500")}
                    disabled={isSubmitting}
                  />
                  {formErrors.city && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {formErrors.city}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    name="designation"
                    placeholder="Enter designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className={cn(formErrors.designation && "border-red-500 focus-visible:ring-red-500")}
                    disabled={isSubmitting}
                  />
                  {formErrors.designation && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {formErrors.designation}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfJoining">Date of Joining *</Label>
                  <Input
                    id="dateOfJoining"
                    name="dateOfJoining"
                    type="date"
                    value={formData.dateOfJoining}
                    onChange={handleInputChange}
                    className={cn(formErrors.dateOfJoining && "border-red-500 focus-visible:ring-red-500")}
                    disabled={isSubmitting}
                  />
                  {formErrors.dateOfJoining && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {formErrors.dateOfJoining}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ID Documents */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Identification Documents</CardTitle>
              <CardDescription>Upload the user's identification documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="idCardFront">ID Card (Front) {!isAdminSelected ? "*" : ""}</Label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                      formErrors.idCardFront ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    )}
                    onClick={() => idCardFrontRef.current?.click()}
                  >
                    <input
                      ref={idCardFrontRef}
                      id="idCardFront"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleIdCardFrontUpload}
                      disabled={isSubmitting}
                    />
                    {idCardFrontPreview ? (
                      <div className="relative">
                        <img
                          src={idCardFrontPreview}
                          alt="ID Card Front"
                          className="max-h-32 mx-auto rounded-md"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFile("idCardFront")
                          }}
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload front side</p>
                      </div>
                    )}
                  </div>
                  {formErrors.idCardFront && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {formErrors.idCardFront}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idCardBack">ID Card (Back) {!isAdminSelected ? "*" : ""}</Label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                      formErrors.idCardBack ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    )}
                    onClick={() => idCardBackRef.current?.click()}
                  >
                    <input
                      ref={idCardBackRef}
                      id="idCardBack"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleIdCardBackUpload}
                      disabled={isSubmitting}
                    />
                    {idCardBackPreview ? (
                      <div className="relative">
                        <img
                          src={idCardBackPreview}
                          alt="ID Card Back"
                          className="max-h-32 mx-auto rounded-md"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFile("idCardBack")
                          }}
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload back side</p>
                      </div>
                    )}
                  </div>
                  {formErrors.idCardBack && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {formErrors.idCardBack}
                    </p>
                  )}
                </div>
              </div>

              {isIssuerSelected && (
                <div className="mt-6 space-y-2">
                  <Label htmlFor="license">License Document *</Label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                      formErrors.license ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    )}
                    onClick={() => licenseRef.current?.click()}
                  >
                    <input
                      ref={licenseRef}
                      id="license"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleLicenseUpload}
                      disabled={isSubmitting}
                    />
                    {licenseDocumentPreview ? (
                      <div className="relative">
                        <img
                          src={licenseDocumentPreview}
                          alt="License Document"
                          className="max-h-32 mx-auto rounded-md"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFile("license")
                          }}
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload license document</p>
                      </div>
                    )}
                  </div>
                  {formErrors.license && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {formErrors.license}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/users")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </div>
  )
}

///earlier 806 only issuer incase of issuer  