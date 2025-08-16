"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { QRCodeCanvas } from "qrcode.react"
import {
  ArrowLeftIcon,
  Download,
  Share2,
  CheckCircle,
  Eye,
  FileText,
  ImageIcon,
  Video,
  X,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { jsPDF } from "jspdf"
import { toast } from "@/components/ui/use-toast"
import { generateAffidavitHash, createAffidavitDataForHash } from "@/lib/utils/hashGenerator"
import { ethers } from "ethers"

const AffidavitRegistryABI = [
  {
    inputs: [
      { internalType: "string", name: "_affidavitId", type: "string" },
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "string", name: "_category", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
      { internalType: "string", name: "_declaration", type: "string" },
      { internalType: "string", name: "_issuerId", type: "string" },
      { internalType: "string", name: "_sellerId", type: "string" },
      { internalType: "string", name: "_buyerId", type: "string" },
      { internalType: "string[]", name: "_witnessIds", type: "string[]" },
      { internalType: "string[]", name: "_ipfsHashes", type: "string[]" },
      { internalType: "string", name: "_dataHash", type: "string" },
    ],
    name: "createAffidavit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_affidavitId", type: "string" }],
    name: "getAffidavit",
    outputs: [
      { internalType: "string", name: "affidavitId", type: "string" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "category", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "string", name: "declaration", type: "string" },
      { internalType: "string", name: "issuerId", type: "string" },
      { internalType: "string", name: "sellerId", type: "string" },
      { internalType: "string", name: "buyerId", type: "string" },
      { internalType: "string[]", name: "ipfsHashes", type: "string[]" },
      { internalType: "string", name: "dataHash", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "onBlockchain", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_affidavitId", type: "string" }],
    name: "getWitnesses",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
]

interface Affidavit {
  _id: string
  displayId: string
  title: string
  category: string
  description: string
  declaration: string
  issuerId: { _id: string; name: string; idCardNumber: string; walletAddress?: string; area?: string }
  issuerName: string
  issuerIdCardNumber: string
  issuerWalletAddress: string
  sellerId?: { _id: string; name: string; idCardNumber: string; walletAddress?: string }
  sellerName?: string
  sellerIdCardNumber?: string
  sellerWalletAddress?: string
  buyerId?: { _id: string; name: string; idCardNumber: string; walletAddress?: string }
  buyerName?: string
  buyerIdCardNumber?: string
  buyerWalletAddress?: string
  witnesses: Array<{
    contactId: { _id: string; name: string; idCardNumber: string; walletAddress?: string }
    hasAccepted?: boolean
  }>
  documents: Array<{ url: string; name: string; type: string; ipfsHash?: string }>
  dataHash: string
  transactionHash?: string
  blockNumber?: number
  isVerifiedOnBlockchain: boolean
  status: string
  dateRequested: string
  dateIssued: string
  requestId: string
  createdBy: { _id: string; name: string; idCardNumber: string }
  details?: Record<string, string | number>
}

export default function AffidavitDetailPage() {
  const router = useRouter()
  const params = useParams()
  const displayId = params.id as string
  const [qrValue, setQrValue] = useState("")
  const qrRef = useRef<HTMLCanvasElement>(null)
  const [affidavit, setAffidavit] = useState<Affidavit | null>(null)
  const [blockchainData, setBlockchainData] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [isFreshHashValid, setIsFreshHashValid] = useState<boolean | null>(null)
  const [isTampered, setIsTampered] = useState<boolean>(false)
  const [originalData, setOriginalData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showOriginalPopup, setShowOriginalPopup] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrValue(`${window.location.origin}/verify/${displayId}`)
    }
    fetchAffidavit()
  }, [displayId])

  const fetchAffidavit = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/affidavits/get?id=${displayId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch affidavit: ${response.statusText}`)
      }
      const data = await response.json()

      if (data.success) {
        setAffidavit(data.affidavit)
        await verifyOnBlockchain(data.affidavit)
      } else {
        throw new Error(data.error || "Failed to fetch affidavit")
      }
    } catch (error) {
      console.error("Error fetching affidavit:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred while fetching affidavit",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOnBlockchain = async (affidavitData: Affidavit) => {
    try {
      setIsVerifying(true)
      if (!affidavitData?._id) {
        throw new Error("Affidavit ID not available. Please reload the page.")
      }

      const affidavitDataForHash = createAffidavitDataForHash(affidavitData)

      const freshDataHash = generateAffidavitHash(affidavitDataForHash)
      console.log("[v0] Verification Input Data:", JSON.stringify(affidavitDataForHash, null, 2))
      console.log("[v0] Fresh Data Hash:", freshDataHash)
      console.log("[v0] Stored MongoDB Data Hash:", affidavitData.dataHash)

      let blockchainData = null
      let originalData = null
      try {
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_GANACHE_RPC_URL || "http://127.0.0.1:7545")
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xED7864989c1f88481C5Ac0242F263DC4CE2D427d"
        const contract = new ethers.Contract(contractAddress, AffidavitRegistryABI, provider)

        const bcData = await contract.getAffidavit(affidavitData.displayId)
        const witnessIds = await contract.getWitnesses(affidavitData.displayId)
        blockchainData = {
          affidavitId: bcData[0],
          title: bcData[1],
          category: bcData[2],
          description: bcData[3],
          declaration: bcData[4],
          issuerId: bcData[5],
          sellerId: bcData[6],
          buyerId: bcData[7],
          ipfsHashes: bcData[8],
          dataHash: bcData[9],
          timestamp: Number(bcData[10]),
          onBlockchain: bcData[11],
          witnessIds: witnessIds || [],
        }
        console.log("Blockchain Data:", blockchainData)
      } catch (error) {
        console.error("Error fetching blockchain data:", error)
        throw new Error("Failed to fetch blockchain data")
      }

      const isVerified = blockchainData.dataHash.toLowerCase() === affidavitData.dataHash.toLowerCase()
      const isFreshHashValidLocal = blockchainData.dataHash.toLowerCase() === freshDataHash.toLowerCase()
      const isTampered = !isVerified || !isFreshHashValidLocal

      setIsVerified(isVerified)
      setIsFreshHashValid(isFreshHashValidLocal)
      setIsTampered(isTampered)
      setBlockchainData(blockchainData)

      if (isTampered) {
        originalData = {
          affidavitId: blockchainData.affidavitId,
          title: blockchainData.title,
          category: blockchainData.category,
          description: blockchainData.description,
          declaration: blockchainData.declaration,
          issuerId: blockchainData.issuerId,
          sellerId: blockchainData.sellerId,
          buyerId: blockchainData.buyerId,
          ipfsHashes: blockchainData.ipfsHashes,
          witnessIds: blockchainData.witnessIds,
          dataHash: blockchainData.dataHash,
          timestamp: blockchainData.timestamp,
        }
      }

      setOriginalData(originalData)

      try {
        await fetch("/api/affidavits/update-verification", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: affidavitData._id, isVerifiedOnBlockchain: isVerified && isFreshHashValidLocal }),
        })
      } catch (error) {
        console.error("Error updating verification status:", error)
      }

      toast({
        title: isVerified && isFreshHashValidLocal ? "Verification Successful" : "Verification Failed",
        description:
          isVerified && isFreshHashValidLocal
            ? "This affidavit is authentic and verified on the blockchain."
            : isTampered
              ? `This affidavit data has been tampered with. Blockchain-MongoDB match: ${isVerified}, Fresh hash match: ${isFreshHashValidLocal}.`
              : "Verification failed due to blockchain error.",
        variant: isVerified && isFreshHashValidLocal ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error verifying affidavit:", error)
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred during verification",
        variant: "destructive",
      })
      setIsVerified(false)
      setIsFreshHashValid(false)
      setIsTampered(true)
    } finally {
      setIsVerifying(false)
    }
  }

  const downloadPDF = () => {
    if (!affidavit) return

    const pdf = new jsPDF("p", "mm", "a4")
    const qrCanvas = qrRef.current
    if (!qrCanvas) return
    const qrImage = qrCanvas.toDataURL("image/png")

    pdf.setDrawColor(0)
    pdf.rect(10, 10, 190, 277)
    pdf.setGState(new pdf.GState({ opacity: 0.1 }))
    pdf.setTextColor(100, 100, 100)
    pdf.setFontSize(60)
    pdf.text("AffidBlock", 105, 150, { align: "center", angle: 45 })
    pdf.setGState(new pdf.GState({ opacity: 1 }))

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(20)
    pdf.text("Government of Pakistan", 105, 30, { align: "center" })
    pdf.setFontSize(18)
    pdf.text(affidavit.title.toUpperCase(), 105, 40, { align: "center" })
    pdf.addImage(qrImage, "PNG", 165, 15, 30, 30)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    let yPos = 55
    const details = [
      { label: "Affidavit ID", value: affidavit.displayId },
      { label: "Issuer", value: affidavit.issuerName || "N/A" },
      { label: "Category", value: affidavit.category },
      { label: "Date Issued", value: new Date(affidavit.dateIssued).toLocaleDateString() },
      { label: "Date Requested", value: new Date(affidavit.dateRequested).toLocaleDateString() },
      { label: "Status", value: affidavit.isVerifiedOnBlockchain ? "Verified" : "Non-Verified" },
      { label: "Created By", value: affidavit.createdBy?.name || "N/A" },
      { label: "Request ID", value: affidavit.requestId || "N/A" },
    ]

    if (affidavit.details) {
      Object.entries(affidavit.details).forEach(([key, value]) => {
        details.push({
          label: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
          value: String(value),
        })
      })
    }

    details.forEach((item) => {
      pdf.text(`${item.label}: ${item.value}`, 15, yPos)
      yPos += 7
    })

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text("PARTIES", 15, yPos + 10)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    yPos += 17
    pdf.text(`Issuer: ${affidavit.issuerName || "N/A"} (ID: ${affidavit.issuerIdCardNumber || "N/A"})`, 15, yPos)
    yPos += 7
    if (affidavit.sellerName) {
      pdf.text(`Seller: ${affidavit.sellerName} (ID: ${affidavit.sellerIdCardNumber || "N/A"})`, 15, yPos)
      yPos += 7
    }
    if (affidavit.buyerName) {
      pdf.text(`Buyer: ${affidavit.buyerName} (ID: ${affidavit.buyerIdCardNumber || "N/A"})`, 15, yPos)
      yPos += 7
    }
    if (affidavit.witnesses && affidavit.witnesses.length > 0) {
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(14)
      pdf.text("WITNESSES", 15, yPos + 10)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(12)
      yPos += 17
      affidavit.witnesses.forEach((witness: any, index: number) => {
        pdf.text(
          `${index + 1}. ${witness.contactId?.name || "N/A"} (ID: ${witness.contactId?.idCardNumber || "N/A"})`,
          15,
          yPos,
        )
        yPos += 7
      })
    }

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text("DECLARATION", 15, yPos + 10)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    pdf.text(affidavit.declaration, 15, yPos + 17, { maxWidth: 180 })
    yPos += pdf.splitTextToSize(affidavit.declaration, 180).length * 7 + 17

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text("STATEMENT OF TRUTH", 15, yPos + 10)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    pdf.text(affidavit.description, 15, yPos + 17, { maxWidth: 180 })

    pdf.setFont("helvetica", "bold")
    pdf.text("Authorized Signature:", 15, 250)
    pdf.setFont("helvetica", "normal")
    pdf.text(affidavit.issuerName || "N/A", 15, 257)

    pdf.setFont("helvetica", "bold")
    pdf.text("Official Seal:", 150, 250)
    pdf.rect(150, 252, 40, 20)

    pdf.setFontSize(10)
    pdf.setTextColor(120, 120, 120)
    pdf.text("AffidBlock - Blockchain-Based Verification Platform", 105, 280, { align: "center" })
    pdf.text(`Verify this document at ${window.location.origin}/verify/${displayId}`, 105, 285, { align: "center" })

    pdf.save(`Affidavit_${displayId}.pdf`)
  }

  const shareAffidavit = async () => {
    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({
          title: `Affidavit: ${affidavit?.title || displayId}`,
          text: `View and verify this affidavit: ${affidavit?.title || displayId}`,
          url: window.location.href,
        })
      } catch (error) {
        fallbackToClipboard()
      }
    } else {
      fallbackToClipboard()
    }
  }

  const fallbackToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => toast({ title: "Link Copied", description: "Link copied to clipboard!" }),
      () => {
        const textArea = document.createElement("textarea")
        textArea.value = window.location.href
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        toast({ title: "Link Copied", description: "Link copied to clipboard!" })
      },
    )
  }

  const handleViewProfile = async (idCard: string) => {
    try {
      const response = await fetch(`/api/user?filter=idCardNumber:${idCard}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`)
      }
      const data = await response.json()
      if (data.success && data.users.length > 0) {
        router.push(`/dashboard/users/${data.users[0]._id}`)
      } else {
        throw new Error("User not found")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch user profile",
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

  const getDocumentThumbnail = (doc: any) => {
    const fileType = doc.type.toLowerCase()
    if (fileType.includes("image")) {
      return (
        <div className="relative w-24 h-24 bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
          <img
            src={doc.url || "/placeholder.svg"}
            alt={doc.name}
            className="w-full h-full object-cover"
            onClick={() => setSelectedDocument(doc)}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
            <Eye className="text-white opacity-0 hover:opacity-100 transition-opacity" size={20} />
          </div>
        </div>
      )
    } else if (fileType.includes("pdf")) {
      return (
        <div
          className="w-24 h-24 bg-red-100 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-red-200 transition-colors"
          onClick={() => window.open(doc.url, "_blank")}
        >
          <FileText className="text-red-600" size={32} />
          <span className="text-xs text-red-600 mt-1">PDF</span>
        </div>
      )
    } else if (fileType.includes("video")) {
      return (
        <div
          className="w-24 h-24 bg-blue-100 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors"
          onClick={() => setSelectedDocument(doc)}
        >
          <Video className="text-blue-600" size={32} />
          <span className="text-xs text-blue-600 mt-1">VIDEO</span>
        </div>
      )
    } else {
      return (
        <div
          className="w-24 h-24 bg-gray-100 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={() => window.open(doc.url, "_blank")}
        >
          <ImageIcon className="text-gray-600" size={32} />
          <span className="text-xs text-gray-600 mt-1">FILE</span>
        </div>
      )
    }
  }

  const generateOriginalAffidavitPDF = async () => {
    if (!originalData) return

    // Get QR code image from the existing canvas
    const qrCanvas = qrRef.current
    if (!qrCanvas) return
    const qrImage = qrCanvas.toDataURL("image/png")

    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()

    // Add watermark
    doc.setFontSize(60)
    doc.setTextColor(200, 200, 200)
    doc.text("ORIGINAL BLOCKCHAIN DATA", 105, 150, { align: "center", angle: 45 })

    // Header
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "bold")
    doc.text("GOVERNMENT OF [STATE/COUNTRY]", 105, 20, { align: "center" })
    doc.text("DEPARTMENT OF LEGAL AFFAIRS", 105, 30, { align: "center" })
    doc.setFontSize(14)
    doc.text("ORIGINAL AFFIDAVIT (BLOCKCHAIN VERIFIED)", 105, 40, { align: "center" })

    // Warning box
    doc.setFillColor(255, 235, 235)
    doc.rect(10, 50, 190, 15, "F")
    doc.setFontSize(10)
    doc.setTextColor(200, 0, 0)
    doc.text("⚠️ WARNING: This document shows ORIGINAL blockchain data. Current data may be tampered.", 15, 60)

    // QR Code - using the same approach as frontend
    doc.addImage(qrImage, "PNG", 160, 70, 30, 30)
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    doc.text("Scan to verify", 175, 105, { align: "center" })

    let yPos = 110

    // Affidavit Details
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("AFFIDAVIT DETAILS", 15, yPos)
    yPos += 10

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`Affidavit ID: ${originalData.displayId || "N/A"}`, 15, yPos)
    yPos += 8
    doc.text(`Title: ${originalData.title || "N/A"}`, 15, yPos)
    yPos += 8
    doc.text(`Category: ${originalData.category || "N/A"}`, 15, yPos)
    yPos += 8
    doc.text(`Description: ${originalData.description || "N/A"}`, 15, yPos)
    yPos += 15

    // Declaration
    doc.setFont("helvetica", "bold")
    doc.text("DECLARATION", 15, yPos)
    yPos += 8
    doc.setFont("helvetica", "normal")
    const declarationLines = doc.splitTextToSize(originalData.declaration || "N/A", 180)
    doc.text(declarationLines, 15, yPos)
    yPos += declarationLines.length * 5 + 10

    // Parties
    doc.setFont("helvetica", "bold")
    doc.text("PARTIES INVOLVED", 15, yPos)
    yPos += 10

    if (originalData.buyerId) {
      doc.setFont("helvetica", "normal")
      doc.text(
        `Buyer: ${originalData.buyerId.name || "N/A"} (ID: ${originalData.buyerId.idCardNumber || "N/A"})`,
        15,
        yPos,
      )
      yPos += 8
    }
    if (originalData.sellerId) {
      doc.text(
        `Seller: ${originalData.sellerId.name || "N/A"} (ID: ${originalData.sellerId.idCardNumber || "N/A"})`,
        15,
        yPos,
      )
      yPos += 8
    }
    if (originalData.issuerId) {
      doc.text(
        `Issuer: ${originalData.issuerId.name || "N/A"} (ID: ${originalData.issuerId.idCardNumber || "N/A"})`,
        15,
        yPos,
      )
      yPos += 15
    }

    // Signature section
    doc.setFont("helvetica", "bold")
    doc.text("VERIFICATION", 15, yPos)
    yPos += 10
    doc.setFont("helvetica", "normal")
    doc.text("Blockchain Hash: " + (originalData.dataHash || "N/A"), 15, yPos)
    yPos += 8
    doc.text("Verification Status: AUTHENTIC (Original Blockchain Data)", 15, yPos)
    yPos += 8
    doc.text("Date: " + new Date().toLocaleDateString(), 15, yPos)

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text("This document contains original blockchain data and serves as proof of authenticity.", 105, 280, {
      align: "center",
    })

    doc.save(`Original_Affidavit_${originalData.displayId || "Unknown"}.pdf`)
  }

  const getNetworkName = () => {
    const rpcUrl = process.env.NEXT_PUBLIC_GANACHE_RPC_URL || "http://127.0.0.1:7545"
    if (rpcUrl.includes("localhost") || rpcUrl.includes("127.0.0.1")) {
      return "Local Testnet (Ganache)"
    } else if (rpcUrl.includes("sepolia")) {
      return "Sepolia Testnet"
    } else if (rpcUrl.includes("goerli")) {
      return "Goerli Testnet"
    } else {
      return "Custom Network"
    }
  }

  const getVerificationStatus = () => {
    if (isVerifying) {
      return (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-800 font-medium">Verifying on blockchain...</span>
        </div>
      )
    }

    if (isVerified === null) {
      return (
        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
          <span className="text-gray-600">Verification pending...</span>
        </div>
      )
    }

    if (isVerified && isFreshHashValid) {
      return (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <CheckCircle className="text-green-600" size={20} />
          <span className="text-green-800 font-medium">✅ AUTHENTIC - Verified on blockchain</span>
        </div>
      )
    } else {
      return (
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="text-red-600" size={20} />
            <span className="text-red-800 font-medium">⚠️ DATA TAMPERED - Not authentic</span>
          </div>
          {originalData && (
            <Button
              onClick={() => setShowOriginalPopup(true)}
              variant="outline"
              className="w-full border-red-200 text-red-700 hover:bg-red-50"
            >
              Show Original Affidavit
            </Button>
          )}
        </div>
      )
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
            <CardContent className="p-4 md:p-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-700">GOVERNMENT OF PAKISTAN</h2>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{affidavit.title}</h1>
                <p className="text-sm text-gray-500 mt-1">Issued under legal compliance</p>
                <div className="border-t border-gray-300 my-4"></div>
              </div>

              {getVerificationStatus()}

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="grid w-full grid-cols-4 text-xs md:text-sm">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="parties">Parties</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {[
                      {
                        label: "Affidavit ID",
                        value: affidavit.displayId,
                      },
                      {
                        label: "Issuer",
                        value: affidavit.issuerName || "N/A",
                      },
                      {
                        label: "Category",
                        value: affidavit.category,
                      },
                      {
                        label: "Date Issued",
                        value: new Date(affidavit.dateIssued).toLocaleDateString(),
                      },
                      {
                        label: "Date Requested",
                        value: new Date(affidavit.dateRequested).toLocaleDateString(),
                      },
                      {
                        label: "Status",
                        value: affidavit.isVerifiedOnBlockchain ? "Verified" : "Non-Verified",
                      },
                      {
                        label: "Created By",
                        value: affidavit.createdBy?.name || "N/A",
                      },
                    ]
                      .concat(
                        affidavit.details
                          ? Object.entries(affidavit.details).map(([key, value]) => ({
                              label: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
                              value: String(value),
                            }))
                          : [],
                      )
                      .map((item, index) => (
                        <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-500">{item.label}</p>
                          <h2 className="text-lg font-semibold break-words">{item.value}</h2>
                        </div>
                      ))}
                  </div>

                  <h2 className="text-lg font-semibold text-gray-700 underline mt-6">Declaration</h2>
                  <p className="text-gray-700 text-justify mt-2">{affidavit.declaration}</p>

                  <h2 className="text-lg font-semibold text-gray-700 underline mt-6">Statement of Truth</h2>
                  <p className="text-gray-700 text-justify mt-2">{affidavit.description}</p>

                  <div className="mt-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Authorized Signature</p>
                      <h2 className="text-lg font-semibold">{affidavit.issuerName || "N/A"}</h2>
                    </div>
                    <div className="text-left md:text-right">
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
                          <h3
                            className="font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => handleViewProfile(affidavit.issuerId?.idCardNumber || "")}
                          >
                            {affidavit.issuerName || "N/A"}
                          </h3>
                          <p className="text-sm text-gray-500">ID: {affidavit.issuerIdCardNumber || "N/A"}</p>
                        </div>
                        {affidavit.sellerName && (
                          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                            <Badge variant="outline" className="mb-2">
                              Seller
                            </Badge>
                            <h3
                              className="font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => handleViewProfile(affidavit.sellerIdCardNumber || "")}
                            >
                              {affidavit.sellerName}
                            </h3>
                            <p className="text-sm text-gray-500">ID: {affidavit.sellerIdCardNumber}</p>
                          </div>
                        )}
                        {affidavit.buyerName && (
                          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                            <Badge variant="outline" className="mb-2">
                              Buyer
                            </Badge>
                            <h3
                              className="font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => handleViewProfile(affidavit.buyerIdCardNumber || "")}
                            >
                              {affidavit.buyerName}
                            </h3>
                            <p className="text-sm text-gray-500">ID: {affidavit.buyerIdCardNumber}</p>
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
                              <h3
                                className="font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => handleViewProfile(witness.contactId?.idCardNumber || "")}
                              >
                                {witness.contactId?.name || "N/A"}
                              </h3>
                              <p className="text-sm text-gray-500">ID: {witness.contactId?.idCardNumber || "N/A"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="pt-4">
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">Attached Documents</h2>
                    {affidavit.documents && affidavit.documents.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {affidavit.documents.map((doc: any, index: number) => (
                          <div key={index} className="space-y-2">
                            {getDocumentThumbnail(doc)}
                            <div className="text-center">
                              <h3 className="font-medium text-sm truncate" title={doc.name}>
                                {doc.name}
                              </h3>
                              <p className="text-xs text-gray-500">{doc.type}</p>
                              <div className="flex gap-1 mt-2">
                                {doc.ipfsHash && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs px-2 py-1 h-auto bg-transparent"
                                    onClick={() =>
                                      window.open(`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`, "_blank")
                                    }
                                  >
                                    View
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs px-2 py-1 h-auto bg-transparent"
                                  onClick={() => {
                                    const link = document.createElement("a")
                                    link.href = doc.url
                                    link.download = doc.name
                                    link.click()
                                  }}
                                >
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No documents attached.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="blockchain" className="pt-4">
                  <div className="space-y-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Network</h3>
                      <p className="text-sm bg-white p-2 rounded border">{getNetworkName()}</p>
                    </div>

                    <div className="bg-gray-100 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Transaction Hash</h3>
                      <p className="text-sm font-mono bg-white p-2 rounded border overflow-x-auto break-all">
                        {affidavit.transactionHash || "Not available"}
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
                        This affidavit is stored on the blockchain for tamper-proof verification.
                      </p>
                    </div>

                    <Button
                      onClick={() => verifyOnBlockchain(affidavit)}
                      variant="outline"
                      disabled={isVerifying}
                      className="w-full"
                    >
                      {isVerifying ? "Verifying..." : "Verify on Blockchain"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="w-full xl:w-1/3 flex flex-col items-center">
          <Card className="w-full shadow-lg">
            <CardContent className="p-4 md:p-6 flex flex-col items-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Verify & Download</h2>

              <div className="bg-white p-4 border rounded-lg shadow-sm mb-6">
                <QRCodeCanvas value={qrValue} size={200} className="mx-auto" ref={qrRef} />
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
                  className="w-full flex items-center justify-center gap-2 bg-transparent"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Affidavit</span>
                </Button>

                <Button
                  onClick={() => verifyOnBlockchain(affidavit)}
                  variant="outline"
                  className="w-full"
                  disabled={isVerifying}
                >
                  {isVerifying ? "Verifying..." : "Verify on Blockchain"}
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

      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedDocument.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDocument(null)}>
                  <X size={16} />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {selectedDocument.type.includes("image") ? (
                <img
                  src={selectedDocument.url || "/placeholder.svg"}
                  alt={selectedDocument.name}
                  className="w-full h-auto rounded-lg"
                />
              ) : selectedDocument.type.includes("video") ? (
                <video controls className="w-full h-auto rounded-lg">
                  <source src={selectedDocument.url} type={selectedDocument.type} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center p-8">
                  <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                  <Button onClick={() => window.open(selectedDocument.url, "_blank")}>Open File</Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showOriginalPopup && originalData && (
        <Dialog open={showOriginalPopup} onOpenChange={setShowOriginalPopup}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={20} />
                Original Blockchain Affidavit (PDF View)
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-800 text-sm">
                  ⚠️ This shows the original data stored on the blockchain in PDF format. The current affidavit data has
                  been tampered with.
                </p>
              </div>

              {/* PDF-like document layout */}
              <div
                className="bg-white border-2 border-black mx-auto max-w-4xl relative"
                style={{ aspectRatio: "210/297" }}
              >
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="text-gray-300 text-8xl font-bold transform rotate-45 opacity-10 select-none"
                    style={{ fontSize: "4rem" }}
                  >
                    AffidBlock
                  </div>
                </div>

                <div className="p-8 relative z-10 h-full flex flex-col">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <h1 className="text-xl font-bold mb-2">Government of Pakistan</h1>
                    <h2 className="text-lg font-semibold mb-4">{originalData.title?.toUpperCase() || "N/A"}</h2>

                    <div className="absolute top-4 right-4 w-16 h-16 bg-white border border-gray-300 flex items-center justify-center">
                      <QRCodeCanvas
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/verify/${originalData.affidavitId}`}
                        size={60}
                        className="w-full h-full"
                      />
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="mb-6 text-sm space-y-1">
                    {[
                      { label: "Affidavit ID", value: originalData.affidavitId || "N/A" },
                      { label: "Category", value: originalData.category || "N/A" },
                      {
                        label: "Date Issued",
                        value: originalData.timestamp
                          ? new Date(originalData.timestamp * 1000).toLocaleDateString()
                          : "N/A",
                      },
                      {
                        label: "Status",
                        value: "Blockchain Verified",
                      },
                    ].map((item, index) => (
                      <div key={index} className="flex">
                        <span className="font-semibold w-32">{item.label}:</span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Parties Section */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold mb-2 underline">PARTIES</h3>
                    <div className="text-sm space-y-1">
                      <div>
                        Issuer: {originalData.issuerName || "N/A"} (ID: {originalData.issuerId || "N/A"})
                      </div>
                      {originalData.sellerId && (
                        <div>
                          Seller: {originalData.sellerName || "N/A"} (ID: {originalData.sellerId})
                        </div>
                      )}
                      {originalData.buyerId && (
                        <div>
                          Buyer: {originalData.buyerName || "N/A"} (ID: {originalData.buyerId})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Declaration Section */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold mb-2 underline">DECLARATION</h3>
                    <p className="text-sm text-justify leading-relaxed">{originalData.declaration || "N/A"}</p>
                  </div>

                  {/* Statement of Truth Section */}
                  <div className="mb-8">
                    <h3 className="text-sm font-bold mb-2 underline">STATEMENT OF TRUTH</h3>
                    <p className="text-sm text-justify leading-relaxed">{originalData.description || "N/A"}</p>
                  </div>

                  {/* Signature Section */}
                  <div className="mt-auto">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-sm font-bold mb-2">Authorized Signature:</div>
                        <div className="text-sm">{originalData.issuerName || "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold mb-2">Official Seal:</div>
                        <div className="w-20 h-12 border border-gray-400"></div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t">
                    <div>AffidBlock - Blockchain-Based Verification Platform</div>
                    <div>
                      Verify this document at {typeof window !== "undefined" ? window.location.origin : ""}/verify/
                      {originalData.affidavitId}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => setShowOriginalPopup(false)}>
                  Close
                </Button>
                <Button onClick={generateOriginalAffidavitPDF} className="bg-red-600 hover:bg-red-700">
                  <Download className="h-4 w-4 mr-2" />
                  Download Original PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
