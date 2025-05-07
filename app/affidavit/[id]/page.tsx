"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { QRCodeCanvas } from "qrcode.react"
import { ArrowLeftIcon, Download, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { jsPDF } from "jspdf"
import { toast } from "@/components/ui/use-toast"
import { verifyAffidavit } from "@/lib/blockchain"

export default function AffidavitDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [qrValue, setQrValue] = useState("")
  const qrRef = useRef<HTMLCanvasElement>(null)
  const [affidavit, setAffidavit] = useState<any>(null)
  const [blockchainData, setBlockchainData] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Set QR code value when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrValue(`${window.location.origin}/verify/${id}`)
    }

    fetchAffidavit()
  }, [id])

  const fetchAffidavit = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/affidavits/get?id=${id}`)
      const data = await response.json()

      if (data.success) {
        setAffidavit(data.affidavit)

        // If the affidavit has blockchain details, verify in the background
        if (data.affidavit.transactionHash || data.affidavit.blockchainHash) {
          verifyOnBlockchainBackground()
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch affidavit",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching affidavit:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOnBlockchainBackground = async () => {
    try {
      // Try to verify using the blockchain service directly
      if (window.ethereum) {
        const result = await verifyAffidavit(id)
        if (result) {
          setBlockchainData(result)
          // Compare with MongoDB data
          const isAuthentic = compareAffidavitData(affidavit, result)
          setIsVerified(isAuthentic)
        }
      } else {
        // Fallback to API if MetaMask is not available
        const response = await fetch(`/api/affidavits/verify?id=${id}`)
        const data = await response.json()
        if (data.success) {
          setBlockchainData(data.blockchainData)
          setIsVerified(data.verified)
        }
      }
    } catch (error) {
      console.error("Background verification error:", error)
      // Don't show error toast for background verification
    }
  }

  const compareAffidavitData = (mongoData: any, blockchainData: any) => {
    if (!mongoData || !blockchainData) return false

    // Basic comparison of essential fields
    const basicChecks = [
      mongoData.displayId === blockchainData.affidavitId,
      mongoData.title === blockchainData.title,
      mongoData.category === blockchainData.category,
      // Add more checks as needed
    ]

    return !basicChecks.some((check) => !check)
  }

  const verifyOnBlockchain = async () => {
    try {
      setIsVerifying(true)
      const response = await fetch(`/api/affidavits/verify?id=${id}`)
      const data = await response.json()

      if (data.success) {
        setIsVerified(data.verified)
        setBlockchainData(data.blockchainData)

        toast({
          title: data.verified ? "Verification Successful" : "Verification Failed",
          description: data.verified
            ? "This affidavit is verified on the blockchain"
            : "This affidavit could not be verified on the blockchain",
          variant: data.verified ? "default" : "destructive",
        })
      } else {
        toast({
          title: "Verification Failed",
          description: data.reason || data.error || "Failed to verify affidavit",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error verifying affidavit:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during verification",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const downloadPDF = () => {
    if (!affidavit) return

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
    pdf.text(affidavit.title.toUpperCase(), 105, 40, { align: "center" })

    // Add QR code
    pdf.addImage(qrImage, "PNG", 165, 15, 30, 30)

    // Add affidavit details
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    pdf.text(`Affidavit ID: ${affidavit.displayId}`, 15, 55)
    pdf.text(`Issued By: ${affidavit.issuerName}`, 15, 62)
    pdf.text(`Category: ${affidavit.category}`, 15, 69)
    pdf.text(`Date Issued: ${new Date(affidavit.dateIssued).toLocaleDateString()}`, 15, 76)
    pdf.text(`Status: ${affidavit.status}`, 15, 83)

    // Add parties
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text("PARTIES", 15, 98)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)

    let yPos = 105

    // Add issuer
    pdf.text(`Issuer: ${affidavit.issuerName}`, 15, yPos)
    yPos += 7

    // Add seller if exists
    if (affidavit.sellerName) {
      pdf.text(`Seller: ${affidavit.sellerName}`, 15, yPos)
      yPos += 7
    }

    // Add buyer if exists
    if (affidavit.buyerName) {
      pdf.text(`Buyer: ${affidavit.buyerName}`, 15, yPos)
      yPos += 7
    }

    // Add witnesses
    if (affidavit.witnesses && affidavit.witnesses.length > 0) {
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(14)
      pdf.text("WITNESSES", 15, yPos + 10)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(12)

      yPos += 17

      affidavit.witnesses.forEach((witness: any, index: number) => {
        pdf.text(`${index + 1}. ${witness.name} (ID: ${witness.idCardNumber})`, 15, yPos)
        yPos += 7
      })
    }

    // Add declaration
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text("DECLARATION", 15, yPos + 10)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    pdf.text(affidavit.declaration, 15, yPos + 17, { maxWidth: 180 })

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
    pdf.text(affidavit.issuerName, 15, 257)

    pdf.setFont("helvetica", "bold")
    pdf.text("Official Seal:", 150, 250)
    pdf.rect(150, 252, 40, 20)

    // Add footer
    pdf.setFontSize(10)
    pdf.setTextColor(120, 120, 120)
    pdf.text("AffidBlock - Blockchain-Based Verification Platform", 105, 280, { align: "center" })
    pdf.text(`Verify this document at ${window.location.origin}/verify/${id}`, 105, 285, { align: "center" })

    // Save PDF
    pdf.save(`Affidavit_${id}.pdf`)
  }

  const shareAffidavit = async () => {
    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({
          title: `Affidavit: ${affidavit?.title || id}`,
          text: `View and verify this affidavit: ${affidavit?.title || id}`,
          url: window.location.href,
        })
        console.log("Content shared successfully")
      } catch (error) {
        console.error("Error sharing:", error)
        fallbackToClipboard()
      }
    } else {
      fallbackToClipboard()
    }
  }

  const fallbackToClipboard = () => {
    try {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "Link copied to clipboard!",
      })
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      const textArea = document.createElement("textarea")
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        document.execCommand("copy")
        toast({
          title: "Link Copied",
          description: "Link copied to clipboard!",
        })
      } catch (err) {
        console.error("Failed to copy using execCommand:", err)
        toast({
          title: "Copy Failed",
          description: `Please copy this link manually: ${window.location.href}`,
          variant: "destructive",
        })
      }

      document.body.removeChild(textArea)
    }
  }

  const handleViewProfile = async (idCard: string) => {
    try {
      const response = await fetch(`/api/user?filter=idCardNumber:${idCard}`)
      const data = await response.json()
      if (data.success && data.users.length > 0) {
        router.push(`/dashboard/users/${data.users[0]._id}`)
      } else {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch user profile",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading affidavit...</p>
        </div>
      </div>
    )
  }

  if (!affidavit) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-center mb-4">Affidavit Not Found</h2>
            <p className="text-gray-500 text-center mb-6">
              The requested affidavit could not be found or you don't have permission to view it.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => router.push("/dashboard/affidavits")}>Back to Affidavits</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-orange-500 border-orange-500">
            Pending
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "revoked":
        return (
          <Badge variant="secondary" className="bg-gray-500 text-white">
            Revoked
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
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
                      { label: "Affidavit ID", value: affidavit.displayId },
                      { label: "Issuer", value: affidavit.issuerName },
                      { label: "Category", value: affidavit.category },
                      { label: "Date Issued", value: new Date(affidavit.dateIssued).toLocaleDateString() },
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
                      <h2 className="text-lg font-semibold">{affidavit.issuerName}</h2>
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
                        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                          <Badge variant="outline" className="mb-2">
                            Issuer
                          </Badge>
                          <h3 className="font-semibold cursor-pointer">{affidavit.issuerName}</h3>
                          <p className="text-sm text-gray-500">ID Card: {affidavit.issuerIdCardNumber}</p>
                        </div>

                        {affidavit.sellerName && (
                          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                            <Badge variant="outline" className="mb-2">
                              Seller
                            </Badge>
                            <h3 className="font-semibold cursor-pointer">{affidavit.sellerName}</h3>
                            <p className="text-sm text-gray-500">ID Card: {affidavit.sellerIdCardNumber}</p>
                          </div>
                        )}

                        {affidavit.buyerName && (
                          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                            <Badge variant="outline" className="mb-2">
                              Buyer
                            </Badge>
                            <h3 className="font-semibold cursor-pointer">{affidavit.buyerName}</h3>
                            <p className="text-sm text-gray-500">ID Card: {affidavit.buyerIdCardNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {affidavit.witnesses && affidavit.witnesses.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-3">Witnesses</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {affidavit.witnesses.map((witness: any, index: number) => (
                            <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-sm">
                              <h3 className="font-semibold cursor-pointer">{witness.name}</h3>
                              <p className="text-sm text-gray-500">ID Card: {witness.idCardNumber}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="blockchain" className="pt-4">
                  <div className="space-y-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Transaction Hash</h3>
                      <p className="text-sm font-mono bg-white p-2 rounded border overflow-x-auto">
                        {affidavit.transactionHash || affidavit.blockchainHash || "Not available"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Block Number</h3>
                        <p className="text-sm font-mono bg-white p-2 rounded border">
                          {affidavit.blockNumber || "Not available"}
                        </p>
                      </div>

                      <div className="bg-gray-100 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Timestamp</h3>
                        <p className="text-sm font-mono bg-white p-2 rounded border">
                          {affidavit.dateIssued ? new Date(affidavit.dateIssued).toISOString() : "Not available"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
                      <h3 className="font-semibold text-blue-800 mb-2">Blockchain Verification</h3>
                      <p className="text-sm text-blue-700">
                        This affidavit has been stored on the blockchain for tamper-proof verification. The digital
                        signature and hash ensure that this document cannot be altered without detection.
                      </p>
                    </div>

                    <Button onClick={verifyOnBlockchain} variant="outline" disabled={isVerifying}>
                      {isVerifying ? "Verifying..." : "Verify on Blockchain"}
                    </Button>

                    {isVerified !== null && (
                      <div
                        className={`p-4 rounded-lg ${isVerified ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                      >
                        <h3 className={`font-semibold mb-2 ${isVerified ? "text-green-800" : "text-red-800"}`}>
                          {isVerified ? "Verification Successful" : "Verification Failed"}
                        </h3>
                        <p className={`text-sm ${isVerified ? "text-green-700" : "text-red-700"}`}>
                          {isVerified
                            ? "This affidavit has been verified on the blockchain and is authentic."
                            : "This affidavit could not be verified on the blockchain. The data may have been tampered with."}
                        </p>
                      </div>
                    )}
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

                <Button onClick={verifyOnBlockchain} variant="outline" className="w-full">
                  Verify on Blockchain
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