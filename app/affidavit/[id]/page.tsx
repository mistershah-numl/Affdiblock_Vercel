"use client"

import { useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { QRCodeCanvas } from "qrcode.react"
import { ArrowLeftIcon, Download, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { jsPDF } from "jspdf"

// Mock affidavit data - in a real app, this would be fetched from the blockchain
const affidavit = {
  id: "AFF-2025-001",
  title: "Affidavit of Ownership Transfer",
  issuer: "John Doe",
  category: "Car",
  dateIssued: "2025-03-01",
  status: "Active",
  stampValue: "RS 100",
  description:
    "This affidavit certifies that the undersigned, John Doe, solemnly declares and affirms that the ownership of the vehicle has been lawfully transferred from Mr. A to Mr. B. The transfer has been executed with full mutual agreement and acknowledgment of both parties, adhering to the laws and regulations governing property ownership transfers. The affiant understands the legal implications of this statement and affirms its accuracy.",
  declaration:
    "I, John Doe, do hereby solemnly affirm and declare that the contents of this affidavit are true and correct to the best of my knowledge and belief, and that nothing has been concealed therein. I understand that any false statement made herein may be punishable under the law.",
  signature: "John Doe",
  parties: [
    { role: "Seller", name: "Mr. A", idCard: "12345-6789012-3" },
    { role: "Buyer", name: "Mr. B", idCard: "98765-4321098-7" },
  ],
  witnesses: [
    { name: "Witness 1", idCard: "11111-2222222-3" },
    { name: "Witness 2", idCard: "44444-5555555-6" },
  ],
  blockchainDetails: {
    transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    blockNumber: 12345678,
    timestamp: "2025-03-01T12:34:56Z",
  },
}

export default function AffidavitDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id
  const [qrValue, setQrValue] = useState("")
  const qrRef = useRef<HTMLCanvasElement>(null)

  // Set QR code value when component mounts
  useState(() => {
    if (typeof window !== "undefined") {
      setQrValue(`${window.location.origin}/verify/${id}`)
    }
  })

  const downloadPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4")

    // Get QR code image
    const qrCanvas = qrRef.current
    if (!qrCanvas) return
    const qrImage = qrCanvas.toDataURL("image/png")

    // Add border
    pdf.setDrawColor(0)
    pdf.setLineWidth(1)
    pdf.rect(10, 10, 190, 277)

    // Add watermark
    pdf.setGState(new pdf.GState({ opacity: 0.1 }))
    pdf.setTextColor(100, 100, 100)
    pdf.setFontSize(60)
    pdf.text("AffidBlock", 105, 150, { align: "center", angle: 45 })

    // Reset opacity
    pdf.setGState(new pdf.GState({ opacity: 1 }))

    // Add header
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(20)
    pdf.setTextColor(0, 0, 0)
    pdf.text("Government of Pakistan", 105, 30, { align: "center" })

    pdf.setFontSize(18)
    pdf.text("AFFIDAVIT OF OWNERSHIP TRANSFER", 105, 40, { align: "center" })

    // Add QR code
    pdf.addImage(qrImage, "PNG", 165, 15, 30, 30)

    // Add affidavit details
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    pdf.text(`Affidavit ID: ${affidavit.id}`, 15, 55)
    pdf.text(`Issued By: ${affidavit.issuer}`, 15, 62)
    pdf.text(`Category: ${affidavit.category}`, 15, 69)
    pdf.text(`Date Issued: ${affidavit.dateIssued}`, 15, 76)
    pdf.text(`Stamp Paper Value: ${affidavit.stampValue}`, 15, 83)
    pdf.text(`Status: ${affidavit.status}`, 15, 90)

    // Add parties
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text("PARTIES", 15, 105)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)

    affidavit.parties.forEach((party, index) => {
      const yPos = 112 + index * 7
      pdf.text(`${party.role}: ${party.name} (ID: ${party.idCard})`, 15, yPos)
    })

    // Add witnesses
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text("WITNESSES", 15, 135)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)

    affidavit.witnesses.forEach((witness, index) => {
      const yPos = 142 + index * 7
      pdf.text(`${index + 1}. ${witness.name} (ID: ${witness.idCard})`, 15, yPos)
    })

    // Add declaration
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text("DECLARATION", 15, 165)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    pdf.text(affidavit.declaration, 15, 172, { maxWidth: 180 })

    // Add statement
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text("STATEMENT OF TRUTH", 15, 195)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    pdf.text(affidavit.description, 15, 202, { maxWidth: 180 })

    // Add signature
    pdf.setFont("helvetica", "bold")
    pdf.text("Authorized Signature:", 15, 250)
    pdf.setFont("helvetica", "normal")
    pdf.text(affidavit.signature, 15, 257)

    pdf.setFont("helvetica", "bold")
    pdf.text("Official Seal:", 150, 250)
    pdf.rect(150, 252, 40, 20)

    // Add footer
    pdf.setFontSize(10)
    pdf.setTextColor(120, 120, 120)
    pdf.text("AffidBlock - Blockchain-Based Verification Platform", 105, 280, { align: "center" })
    pdf.text("Verify this document at www.affidblock.com/verify", 105, 285, { align: "center" })

    // Save PDF
    pdf.save(`Affidavit_${id}.pdf`)
  }

  const shareAffidavit = async () => {
    // Check if the Web Share API is supported
    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({
          title: `Affidavit: ${affidavit.title}`,
          text: `View and verify this affidavit: ${affidavit.title}`,
          url: window.location.href,
        })
        console.log("Content shared successfully")
      } catch (error) {
        console.error("Error sharing:", error)

        // Fallback to clipboard if sharing fails
        fallbackToClipboard()
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      fallbackToClipboard()
    }
  }

  // Fallback function to copy to clipboard
  const fallbackToClipboard = () => {
    try {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)

      // Final fallback - show the URL to manually copy
      const textArea = document.createElement("textarea")
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        document.execCommand("copy")
        alert("Link copied to clipboard!")
      } catch (err) {
        console.error("Failed to copy using execCommand:", err)
        alert(`Please copy this link manually: ${window.location.href}`)
      }

      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col xl:flex-row items-center xl:items-start gap-8">
        <div className="w-full xl:w-2/3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-all duration-200 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-lg font-semibold">Back</span>
          </button>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-700">GOVERNMENT OF PAKISTAN</h2>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">{affidavit.title.toUpperCase()}</h1>
                <p className="text-sm text-gray-500 mt-1">Issued under legal compliance</p>
                <div className="border-t border-gray-300 my-4"></div>
                <Badge
                  className={`${
                    affidavit.status === "Active"
                      ? "bg-green-500"
                      : affidavit.status === "Pending"
                        ? "bg-orange-500"
                        : "bg-red-500"
                  }`}
                >
                  {affidavit.status}
                </Badge>
              </div>

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="parties">Parties & Witnesses</TabsTrigger>
                  <TabsTrigger value="blockchain">Blockchain Info</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {[
                      { label: "Affidavit ID", value: affidavit.id },
                      { label: "Issuer", value: affidavit.issuer },
                      { label: "Category", value: affidavit.category },
                      { label: "Date Issued", value: affidavit.dateIssued },
                      { label: "Stamp Paper Value", value: affidavit.stampValue },
                      { label: "Status", value: affidavit.status },
                    ].map((item, index) => (
                      <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-500">{item.label}</p>
                        <h2 className="text-lg font-semibold">{item.value}</h2>
                      </div>
                    ))}
                  </div>

                  <h2 className="text-lg font-semibold text-gray-700 underline mt-6">Declaration</h2>
                  <p className="text-gray-700 text-justify mt-2">{affidavit.declaration}</p>

                  <h2 className="text-lg font-semibold text-gray-700 underline mt-6">Statement of Truth</h2>
                  <p className="text-gray-700 text-justify mt-2">{affidavit.description}</p>

                  <div className="mt-10 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Authorized Signature</p>
                      <h2 className="text-lg font-semibold">{affidavit.signature}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Official Seal</p>
                      <div className="w-20 h-10 border border-gray-400 rounded-lg mt-2"></div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="parties" className="pt-4">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-700 mb-3">Parties</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {affidavit.parties.map((party, index) => (
                          <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-sm">
                            <Badge variant="outline" className="mb-2">
                              {party.role}
                            </Badge>
                            <h3 className="font-semibold">{party.name}</h3>
                            <p className="text-sm text-gray-500">ID Card: {party.idCard}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-gray-700 mb-3">Witnesses</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {affidavit.witnesses.map((witness, index) => (
                          <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-sm">
                            <h3 className="font-semibold">{witness.name}</h3>
                            <p className="text-sm text-gray-500">ID Card: {witness.idCard}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="blockchain" className="pt-4">
                  <div className="space-y-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Transaction Hash</h3>
                      <p className="text-sm font-mono bg-white p-2 rounded border overflow-x-auto">
                        {affidavit.blockchainDetails.transactionHash}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Block Number</h3>
                        <p className="text-sm font-mono bg-white p-2 rounded border">
                          {affidavit.blockchainDetails.blockNumber}
                        </p>
                      </div>

                      <div className="bg-gray-100 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Timestamp</h3>
                        <p className="text-sm font-mono bg-white p-2 rounded border">
                          {affidavit.blockchainDetails.timestamp}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
                      <h3 className="font-semibold text-blue-800 mb-2">Blockchain Verification</h3>
                      <p className="text-sm text-blue-700">
                        This affidavit has been verified on the blockchain and is tamper-proof. The digital signature
                        and hash ensure that this document cannot be altered without detection.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="w-full xl:w-1/3 flex flex-col items-center">
          <Card className="w-full shadow-lg">
            <CardContent className="p-6 flex flex-col items-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Verify & Download</h2>

              <div className="bg-white p-4 border rounded-lg shadow-sm mb-6">
                <QRCodeCanvas
                  value={qrValue || `https://affidblock.com/verify/${id}`}
                  size={200}
                  className="mx-auto"
                  ref={qrRef}
                />
                <p className="text-center text-sm text-gray-500 mt-2">Scan to verify this affidavit</p>
              </div>

              <div className="w-full space-y-3">
                <Button onClick={downloadPDF} className="w-full flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={shareAffidavit}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Affidavit</span>
                </Button>
              </div>

              <div className="mt-6 p-4 bg-gray-100 rounded-lg w-full">
                <h3 className="font-semibold text-gray-800 mb-2">Verification Instructions</h3>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Scan the QR code with any QR scanner</li>
                  <li>You will be redirected to the verification page</li>
                  <li>The system will automatically check the blockchain</li>
                  <li>Verification results will be displayed instantly</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
