"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Upload, FileText, X } from "lucide-react"

interface IssuerApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formSchema = z.object({
  licenseNumber: z.string().min(5, {
    message: "License number must be at least 5 characters.",
  }),
  organization: z.string().min(3, {
    message: "Organization name must be at least 3 characters.",
  }),
  experience: z.string().min(10, {
    message: "Please provide more details about your experience.",
  }),
  city: z.string().min(2, {
    message: "City is required.",
  }),
  address: z.string().min(10, {
    message: "Please provide your complete address.",
  }),
})

export default function IssuerApplicationDialog({ open, onOpenChange }: IssuerApplicationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [licensePdf, setLicensePdf] = useState<File | null>(null)
  const [certificatesPdf, setCertificatesPdf] = useState<File | null>(null)
  const [otherDocumentsPdf, setOtherDocumentsPdf] = useState<File | null>(null)

  const licenseFileRef = useRef<HTMLInputElement>(null)
  const certificatesFileRef = useRef<HTMLInputElement>(null)
  const otherDocumentsFileRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      licenseNumber: "",
      organization: "",
      experience: "",
      city: "",
      address: "",
    },
  })

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === "application/pdf") {
        setFile(file)
      } else {
        alert("Please upload a PDF file")
      }
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!licensePdf) {
      alert("Please upload your license document")
      return
    }

    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      console.log({
        ...values,
        licensePdf,
        certificatesPdf,
        otherDocumentsPdf,
      })
      setIsSubmitting(false)
      onOpenChange(false)

      // Show success message
      alert("Your application has been submitted successfully. We will review it and get back to you soon.")
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to Become an Issuer</DialogTitle>
          <DialogDescription>
            Fill out this form to apply for issuer privileges. We'll review your application and get back to you soon.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. ATR-12345" {...field} />
                    </FormControl>
                    <FormDescription>Your lawyer/attorney license number</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization/Firm</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Legal Services LLC" {...field} />
                    </FormControl>
                    <FormDescription>Your law firm or organization name</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Islamabad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Office Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 123 Main Street, Suite 456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Experience</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your experience as a legal professional..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Briefly describe your experience and qualifications</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <Label>Required Documents</Label>

              <div className="space-y-2">
                <Label htmlFor="licensePdf" className="text-sm flex items-center gap-1">
                  License Document <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => licenseFileRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload License PDF</span>
                  </Button>
                  <input
                    ref={licenseFileRef}
                    id="licensePdf"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setLicensePdf)}
                  />
                  {licensePdf && (
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm truncate max-w-[200px]">{licensePdf.name}</span>
                      <button
                        type="button"
                        onClick={() => setLicensePdf(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload a scanned copy of your lawyer/attorney license (PDF only)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificatesPdf" className="text-sm">
                  Certificates (Optional)
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => certificatesFileRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Certificates</span>
                  </Button>
                  <input
                    ref={certificatesFileRef}
                    id="certificatesPdf"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setCertificatesPdf)}
                  />
                  {certificatesPdf && (
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm truncate max-w-[200px]">{certificatesPdf.name}</span>
                      <button
                        type="button"
                        onClick={() => setCertificatesPdf(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload any relevant certificates or qualifications (PDF only)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherDocumentsPdf" className="text-sm">
                  Other Documents (Optional)
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => otherDocumentsFileRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Other Documents</span>
                  </Button>
                  <input
                    ref={otherDocumentsFileRef}
                    id="otherDocumentsPdf"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setOtherDocumentsPdf)}
                  />
                  {otherDocumentsPdf && (
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm truncate max-w-[200px]">{otherDocumentsPdf.name}</span>
                      <button
                        type="button"
                        onClick={() => setOtherDocumentsPdf(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload any additional supporting documents (PDF only)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
