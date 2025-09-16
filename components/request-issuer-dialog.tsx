"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { XCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast"

interface RequestIssuerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function RequestIssuerDialog({ open, onOpenChange }: RequestIssuerDialogProps) {
  const { token, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [organization, setOrganization] = useState("")
  const [city, setCity] = useState("")
  const [designation, setDesignation] = useState("")
  const [dateOfJoining, setDateOfJoining] = useState("")
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (open && token && user) {
      checkPendingRequest()
      resetForm()
    }
  }, [open, token, user])

  const checkPendingRequest = async () => {
    try {
      const response = await fetch("/api/issuer-requests/check", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success && data.hasPendingRequest) {
        setHasPendingRequest(true)
        toast({ title: "Pending Request", description: data.message, variant: "destructive" })
      } else {
        setHasPendingRequest(false)
      }
    } catch (error) {
      console.error("Error checking pending request:", error)
      toast({ title: "Error", description: "Failed to check pending request", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setOrganization("")
    setCity("")
    setDesignation("")
    setDateOfJoining("")
    setLicenseFile(null)
    setFormErrors({})
    setIsSubmitting(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Only JPEG, PNG, GIF, WebP, or PDF files are allowed",
          variant: "destructive",
        })
        return
      }
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB",
          variant: "destructive",
        })
        return
      }
      setLicenseFile(file)
    }
  }

  const validateForm = () => {
    const errors: { [key: string]: string } = {}
    if (!organization.trim()) errors.organization = "Organization is required"
    if (!city.trim()) errors.city = "City is required"
    if (!designation.trim()) errors.designation = "Designation is required"
    if (!dateOfJoining) errors.dateOfJoining = "Date of joining is required"
    else if (isNaN(new Date(dateOfJoining).getTime())) errors.dateOfJoining = "Invalid date format"
    if (!licenseFile) errors.licenseFile = "License document is required"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Form Error",
        description: "Please fill all required fields correctly",
        variant: "destructive",
      })
      return
    }

    if (!user || !user.idCardNumber) {
      toast({
        title: "Error",
        description: "User information is missing",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("organization", organization)
      formData.append("city", city)
      formData.append("designation", designation)
      formData.append("dateOfJoining", dateOfJoining)
      if (licenseFile) formData.append("license", licenseFile)

      console.log("Form data entries:", [...formData.entries()]) // Debug form data

      const response = await fetch("/api/issuer-requests/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Issuer request submitted successfully",
          variant: "default",
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to submit request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting issuer request:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Request Issuer Role</DialogTitle>
          <DialogDescription>
            Fill in the details below to request the Issuer role. <span className="text-red-500">*</span> indicates required fields.
          </DialogDescription>
        </DialogHeader>

        {hasPendingRequest ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <p className="text-center text-gray-600">You already have a pending issuer request. Please wait for admin review.</p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <div className="flex-1 space-y-6 py-6">
            <div>
              <Label htmlFor="organization">Organization <span className="text-red-500">*</span></Label>
              <Input
                id="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Enter your organization"
                className={formErrors.organization ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {formErrors.organization && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <XCircle className="h-3 w-3" /> {formErrors.organization}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city"
                className={formErrors.city ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {formErrors.city && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <XCircle className="h-3 w-3" /> {formErrors.city}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="designation">Designation <span className="text-red-500">*</span></Label>
              <Input
                id="designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Enter your designation"
                className={formErrors.designation ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {formErrors.designation && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <XCircle className="h-3 w-3" /> {formErrors.designation}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="dateOfJoining">Date of Joining <span className="text-red-500">*</span></Label>
              <Input
                id="dateOfJoining"
                type="date"
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
                className={formErrors.dateOfJoining ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {formErrors.dateOfJoining && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <XCircle className="h-3 w-3" /> {formErrors.dateOfJoining}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="licenseFile">License Document <span className="text-red-500">*</span></Label>
              <Input
                id="licenseFile"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                onChange={handleFileChange}
                className={formErrors.licenseFile ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              <p className="text-sm text-gray-500 mt-1">Max 10MB (JPEG, PNG, GIF, WebP, PDF)</p>
              {formErrors.licenseFile && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <XCircle className="h-3 w-3" /> {formErrors.licenseFile}
                </p>
              )}
            </div>
            {licenseFile && (
              <div className="flex items-center justify-between bg-gray-100 p-3 rounded-md">
                <span>{licenseFile.name}</span>
                <Button variant="ghost" size="icon" onClick={() => setLicenseFile(null)}>
                  <XCircle className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        )}

        {!hasPendingRequest && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}