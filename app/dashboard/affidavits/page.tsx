"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Filter, Edit, Trash2, Eye, AlertCircle, FilePlus, CheckCircle, XCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import CreateAffidavitDialog from "@/components/create-affidavit-dialog"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast"
import { ethers } from "ethers"
import { getConnectedMetaMaskWallet } from "@/lib/blockchain"
import { generateAffidavitHash, createAffidavitDataForHash } from "@/lib/utils/hashGenerator"

const AffidavitRegistryABI = {
  abi: [
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
      inputs: [],
      name: "getAffidavitCount",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
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
      inputs: [{ internalType: "string", name: "_userId", type: "string" }],
      name: "getUserAffidavits",
      outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
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
    {
      inputs: [{ internalType: "string", name: "_affidavitId", type: "string" }],
      name: "revokeAffidavit",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "string", name: "_affidavitId", type: "string" }],
      name: "verifyAffidavit",
      outputs: [
        { internalType: "bool", name: "exists", type: "bool" },
        { internalType: "bool", name: "onBlockchain", type: "bool" },
      ],
      stateMutability: "view",
      type: "function",
    },
  ],
}

interface AffidavitRequest {
  _id: string
  displayId: string
  title: string
  category: string
  issuerId: { _id: string; name: string; area: string; idCardNumber: string; walletAddress?: string }
  issuerAccepted: boolean | null
  description: string
  declaration: string
  userRole: string
  sellerId?: { _id: string; name: string; idCardNumber: string; walletAddress?: string }
  sellerAccepted: boolean | null
  buyerId?: { _id: string; name: string; idCardNumber: string; walletAddress?: string }
  buyerAccepted: boolean | null
  witnesses: Array<{
    contactId: { _id: string; name: string; idCardNumber: string; walletAddress?: string }
    hasAccepted: boolean | null
  }>
  documents: Array<{ url: string; name: string; type: string; ipfsHash?: string }>
  details: Record<string, string | number>
  createdBy: { _id: string; name: string; idCardNumber: string }
  initiatorIdCardNumber: string
  status: string
  createdAt: string
}

interface Affidavit {
  _id: string
  displayId: string
  title: string
  category: string
  issuerId: { _id: string; name: string; area: string; idCardNumber: string } | string
  issuerName: string
  issuerIdCardNumber: string
  issuerWalletAddress: string
  sellerId: string
  sellerName: string
  sellerIdCardNumber: string
  sellerWalletAddress: string
  buyerId: string
  buyerName: string
  buyerIdCardNumber: string
  buyerWalletAddress: string
  description: string
  declaration: string
  dateRequested: string
  dateIssued: string
  status: string
  transactionHash?: string
  blockNumber?: number
  createdAt: string
  dataHash: string
  witnesses: Array<{
    contactId: string
    name: string
    idCardNumber: string
    walletAddress: string
  }>
  documents: Array<{
    name: string
    type: string
    url: string
    ipfsHash?: string
  }>
  requestId: string
  createdBy: string
}

export default function AffidavitsPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [requestStatusFilter, setRequestStatusFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewRequestDialogOpen, setIsViewRequestDialogOpen] = useState(false)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [selectedAffidavitId, setSelectedAffidavitId] = useState<string | null>(null)
  const [selectedAffidavitRequest, setSelectedAffidavitRequest] = useState<AffidavitRequest | null>(null)
  const [selectedAffidavit, setSelectedAffidavit] = useState<Affidavit | null>(null)
  const [affidavitRequests, setAffidavitRequests] = useState<AffidavitRequest[]>([])
  const [affidavits, setAffidavits] = useState<Affidavit[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  const [isLoadingAffidavits, setIsLoadingAffidavits] = useState(true)
  const [isProcessingBlockchain, setIsProcessingBlockchain] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    isVerified: boolean
    message: string
    blockchainData?: any
  } | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)

  const userRole = user?.activeRole || "User"

  useEffect(() => {
    if (user?._id) {
      fetchAffidavitRequests()
      fetchAffidavits()
    } else {
      setIsLoadingRequests(false)
      setIsLoadingAffidavits(false)
      setAffidavitRequests([])
      setAffidavits([])
      toast({
        title: "Error",
        description: "User not authenticated. Please log in to view affidavits.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }, [user?._id])

  const fetchAffidavitRequests = async () => {
    setIsLoadingRequests(true)
    try {
      const response = await fetch(
        `/api/affidavits/affidavit-requests/get?userId=${user?._id}&activeRole=${userRole}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setAffidavitRequests(data.affidavitRequests || [])
      } else {
        setAffidavitRequests([])
        toast({
          title: "Error",
          description: data.error || "Failed to fetch affidavit requests",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setAffidavitRequests([])
      toast({
        title: "Error",
        description: error.message || "Failed to fetch affidavit requests.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const fetchAffidavits = async () => {
    setIsLoadingAffidavits(true)
    try {
      const response = await fetch(`/api/affidavits/get-all?userId=${user?._id}&role=${userRole}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setAffidavits(data.affidavits || [])
      } else {
        setAffidavits([])
        toast({ title: "Error", description: data.error || "Failed to fetch affidavits", variant: "destructive" })
      }
    } catch (error: any) {
      setAffidavits([])
      toast({ title: "Error", description: error.message || "Failed to fetch affidavits.", variant: "destructive" })
    } finally {
      setIsLoadingAffidavits(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "accepted":
        return <Badge className="bg-green-500 text-white">Accepted</Badge>
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

  const filteredAffidavits = affidavits.filter((affidavit) => {
    const matchesSearch =
      affidavit.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.displayId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.issuerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.category?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || affidavit.status?.toLowerCase() === statusFilter.toLowerCase()
    const matchesCategory =
      categoryFilter === "all" || affidavit.category?.toLowerCase() === categoryFilter.toLowerCase()

    return matchesSearch && matchesStatus && matchesCategory
  })

  const filteredAffidavitRequests = affidavitRequests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.issuerId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.sellerId?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.buyerId?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.witnesses.some((w) => w.contactId.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus =
      requestStatusFilter === "all" || request.status.toLowerCase() === requestStatusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const handleDeleteClick = (id: string) => {
    setSelectedAffidavitId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedAffidavitId) return

    try {
      const response = await fetch(`/api/affidavits/delete?id=${selectedAffidavitId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (data.success) {
        toast({ title: "Success", description: "Affidavit deleted successfully" })
        fetchAffidavits()
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete affidavit", variant: "destructive" })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while deleting the affidavit",
        variant: "destructive",
      })
    }

    setIsDeleteDialogOpen(false)
    setSelectedAffidavitId(null)
  }

  const handleViewRequest = (request: AffidavitRequest) => {
    setSelectedAffidavitRequest(request)
    setIsViewRequestDialogOpen(true)
  }

  const handleVerifyOnBlockchain = async (affidavit: Affidavit) => {
    try {
      setIsProcessingBlockchain(true)
      setVerificationResult(null)
      setSelectedAffidavit(affidavit)
      setIsVerifyDialogOpen(true)

      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask and try again.")
      }

      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_GANACHE_RPC_URL || "http://127.0.0.1:7545")
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xED7864989c1f88481C5Ac0242F263DC4CE2D427d"
      const contract = new ethers.Contract(contractAddress, AffidavitRegistryABI.abi, provider)

      const blockchainData = await contract.getAffidavit(affidavit.displayId)
      const witnessIds = await contract.getWitnesses(affidavit.displayId)
      const blockchainHash = blockchainData.dataHash

      const affidavitDataForHash = createAffidavitDataForHash(affidavit)
      const freshHash = generateAffidavitHash(affidavitDataForHash)

      console.log("[v0] Dashboard Verification - Fresh Hash:", freshHash)
      console.log("[v0] Dashboard Verification - Blockchain Hash:", blockchainHash)

      const isVerified = freshHash.toLowerCase() === blockchainHash.toLowerCase()

      setVerificationResult({
        isVerified,
        message: isVerified
          ? "Affidavit is active and authentic on the blockchain."
          : "Verification failed: Data has been tampered with or does not match blockchain records.",
        blockchainData: {
          affidavitId: blockchainData[0],
          title: blockchainData[1],
          category: blockchainData[2],
          description: blockchainData[3],
          declaration: blockchainData[4],
          issuerId: blockchainData[5],
          sellerId: blockchainData[6],
          buyerId: blockchainData[7],
          ipfsHashes: blockchainData[8],
          dataHash: blockchainData[9],
          timestamp: Number(blockchainData[10]),
          onBlockchain: blockchainData[11],
          witnessIds: witnessIds || [],
        },
      })
    } catch (error: any) {
      console.error("Verification error:", error)
      setVerificationResult({
        isVerified: false,
        message: `Verification failed: ${error.message || "Unable to verify on blockchain"}`,
      })
    } finally {
      setIsProcessingBlockchain(false)
    }
  }

  const generateUniqueDisplayId = async (contract: any, year: number): Promise<string> => {
    let isUnique = false
    let displayId = ""
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      displayId = `AFF-${year}-${Math.floor(10000 + Math.random() * 90000)}`
      try {
        const affidavitData = await contract.getAffidavit(displayId)
        if (!affidavitData.onBlockchain) {
          isUnique = true // Affidavit doesn't exist, ID is unique
        }
      } catch (error: any) {
        if (error.message.includes("Affidavit does not exist")) {
          isUnique = true // Error indicates ID doesn't exist, so it's unique
        }
      }
      attempts++
    }

    if (!isUnique) {
      throw new Error("Failed to generate a unique displayId after multiple attempts")
    }

    return displayId
  }

  // ... (previous code remains unchanged until handleRespondRequest)

  const handleRespondRequest = async (action: "accept" | "reject") => {
    if (!selectedAffidavitRequest || !user?._id || !token) {
      toast({
        title: "Error",
        description: "No affidavit request selected or user not authenticated",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    const isAccepted = action === "accept"

    try {
      if (user.activeRole !== "Issuer" || !isAccepted || selectedAffidavitRequest.issuerId._id !== user._id) {
        const response = await fetch("/api/affidavits/affidavit-requests/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            requestId: selectedAffidavitRequest._id,
            userId: user._id,
            activeRole: user.activeRole,
            action,
          }),
        })

        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || `Failed to ${action} the request`)
        }

        toast({
          title: "Success",
          description: `Successfully ${action}ed the affidavit request`,
          variant: "default",
        })

        setAffidavitRequests((prev) =>
          prev.map((req) =>
            req._id === selectedAffidavitRequest._id ? { ...req, status: isAccepted ? "accepted" : "rejected" } : req,
          ),
        )

        await Promise.all([fetchAffidavitRequests(), fetchAffidavits()])
        setIsViewRequestDialogOpen(false)
        return
      }

      // Issuer accepting the affidavit
      if (!allNonIssuersAccepted(selectedAffidavitRequest)) {
        throw new Error("All non-issuer parties must accept before the issuer can deploy to blockchain")
      }

      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask and try again.")
      }

      const issuerResponse = await fetch(`/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const issuerData = await issuerResponse.json()
      if (!issuerData.success || !issuerData.currentUser) {
        throw new Error("Failed to fetch issuer data")
      }
      const issuerWallet = issuerData.currentUser.walletAddress
      if (!issuerWallet) {
        throw new Error("Issuer wallet address is not set. Please connect your blockchain wallet.")
      }

      const connectedWallet = await getConnectedMetaMaskWallet()
      if (!connectedWallet || connectedWallet.toLowerCase() !== issuerWallet.toLowerCase()) {
        throw new Error(`Please connect MetaMask with address ${issuerWallet}.`)
      }

      setIsProcessingBlockchain(true)
      toast({
        title: "Connecting to MetaMask",
        description: "Please connect your wallet in MetaMask...",
        duration: 5000,
      })

      const provider = new ethers.BrowserProvider(window.ethereum)
      await window.ethereum.request({ method: "eth_requestAccounts" })
      const signer = await provider.getSigner()
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xED7864989c1f88481C5Ac0242F263DC4CE2D427d"

      if (!contractAddress) {
        throw new Error("Contract address not set in environment variables.")
      }

      const network = await provider.getNetwork()
      const expectedChainId = 1337
      if (Number(network.chainId) !== expectedChainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            throw new Error(
              `Ganache network (Chain ID: ${expectedChainId}) not added to MetaMask. Please add it manually.`,
            )
          }
          throw new Error(`Failed to switch to Ganache network: ${switchError.message}`)
        }
      }

      let contract
      try {
        contract = new ethers.Contract(contractAddress, AffidavitRegistryABI.abi, signer)
        const code = await provider.getCode(contractAddress)
        if (code === "0x") {
          throw new Error(`No contract deployed at address ${contractAddress}`)
        }
        const affidavitCount = await contract.getAffidavitCount()
        console.log("Current affidavit count:", affidavitCount.toString())
      } catch (error: any) {
        console.error("Contract initialization error:", error)
        throw new Error(`Failed to initialize contract at ${contractAddress}: ${error.message}`)
      }

      toast({
        title: "Preparing Affidavit",
        description: "Generating affidavit data...",
        duration: 5000,
      })

      // Generate a unique displayId
      const currentYear = new Date().getFullYear()
      const displayId = await generateUniqueDisplayId(contract, currentYear)

      const ipfsHashes = selectedAffidavitRequest.documents.map((doc) => doc.ipfsHash || "")
      const witnessIds = selectedAffidavitRequest.witnesses.map((w) => w.contactId._id.toString())

      const affidavitDataForHash = createAffidavitDataForHash({
        ...selectedAffidavitRequest,
        displayId,
        dateIssued: new Date().toISOString(),
      })

      const dataHash = generateAffidavitHash(affidavitDataForHash)

      console.log("[v0] Dashboard Deployment - Generated Hash:", dataHash)
      console.log("[v0] Dashboard Deployment - Affidavit Data:", JSON.stringify(affidavitDataForHash, null, 2))

      const blockchainData = {
        affidavitId: displayId,
        title: selectedAffidavitRequest.title || "",
        category: selectedAffidavitRequest.category || "",
        description: selectedAffidavitRequest.description || "",
        declaration: selectedAffidavitRequest.declaration || "",
        issuerId: selectedAffidavitRequest.issuerId._id.toString(),
        sellerId: selectedAffidavitRequest.sellerId?._id.toString() || "",
        buyerId: selectedAffidavitRequest.buyerId?._id.toString() || "",
        witnessIds,
        ipfsHashes,
        dataHash,
      }

      console.log("Blockchain Deployment-Data:", JSON.stringify(blockchainData, null, 2))

      toast({
        title: "Processing Transaction",
        description: "Please confirm the transaction in MetaMask...",
        duration: 10000,
      })

      let transactionHash: string
      let blockNumber: number

      // Create transaction
      const tx = await contract.createAffidavit(
        blockchainData.affidavitId,
        blockchainData.title,
        blockchainData.category,
        blockchainData.description,
        blockchainData.declaration,
        blockchainData.issuerId,
        blockchainData.sellerId,
        blockchainData.buyerId,
        blockchainData.witnessIds,
        blockchainData.ipfsHashes,
        blockchainData.dataHash,
        {
          gasLimit: 1000000, // Set a reasonable gas limit
        },
      )
      console.log("Transaction sent:", { hash: tx.hash, ...tx })

      // Wait for transaction confirmation
      toast({
        title: "Transaction Sent",
        description: "Waiting for confirmation...",
        duration: 15000,
      })

      let receipt
      try {
        receipt = await tx.wait(1) // Wait for 1 confirmation
        console.log("Transaction receipt:", JSON.stringify(receipt, null, 2))
        transactionHash = tx.hash
        blockNumber = Number(receipt.blockNumber)
        console.log(`Transaction confirmed: hash=${transactionHash}, blockNumber=${blockNumber}`)
      } catch (waitError: any) {
        console.error("Error waiting for transaction receipt:", waitError)
        throw new Error(`Failed to confirm transaction: ${waitError.message || "Unknown error"}`)
      }

      if (!receipt || receipt.status !== 1) {
        throw new Error(`Transaction failed: status ${receipt?.status || "unknown"}, hash ${tx.hash}`)
      }

      // Verify affidavit on blockchain
      try {
        const verifyProvider = new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_GANACHE_RPC_URL || "http://127.0.0.1:7545",
        )
        const verifyContract = new ethers.Contract(contractAddress, AffidavitRegistryABI.abi, verifyProvider)
        const bcData = await verifyContract.getAffidavit(displayId)
        console.log("Verified affidavit on blockchain:", {
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
        })
      } catch (verifyError: any) {
        console.error("Verification error:", verifyError)
        throw new Error(`Failed to verify affidavit on blockchain: ${verifyError.message}`)
      }

      // Prepare and log API payload
      const payload = {
        requestId: selectedAffidavitRequest._id,
        userId: user._id,
        activeRole: user.activeRole,
        action,
        transactionHash,
        blockNumber,
        displayId,
        dataHash,
      }
      console.log("Sending API payload:", JSON.stringify(payload, null, 2))

      toast({
        title: "Updating Affidavit",
        description: "Saving blockchain details to database...",
        duration: 5000,
      })

      const updateResponse = await fetch("/api/affidavits/affidavit-requests/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      const updateResult = await updateResponse.json() // Fixed: Changed 'response' to 'updateResponse'
      if (!updateResponse.ok || !updateResult.success) {
        console.error("API response error:", updateResult)
        throw new Error(`Failed to update affidavit: ${updateResult.error || "Unknown error"}`)
      }

      setAffidavitRequests((prev) =>
        prev.map((req) =>
          req._id === selectedAffidavitRequest._id ? { ...req, status: "accepted", issuerAccepted: true } : req,
        ),
      )

      toast({
        title: "Success",
        description: "Affidavit accepted and deployed to blockchain successfully",
        variant: "success",
      })

      await Promise.all([fetchAffidavitRequests(), fetchAffidavits()])
      setIsViewRequestDialogOpen(false)
    } catch (error: any) {
      console.error("Error in handleRespondRequest:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process the transaction",
        variant: "destructive",
        duration: 5000,
      })

      if (isAccepted && user.activeRole === "Issuer" && selectedAffidavitRequest.issuerId._id === user._id) {
        setAffidavitRequests((prev) =>
          prev.map((req) =>
            req._id === selectedAffidavitRequest._id ? { ...req, status: "pending", issuerAccepted: null } : req,
          ),
        )
      }
    } finally {
      setIsProcessingBlockchain(false)
    }
  }

  const handleAcceptAndDeploy = async (affidavitRequest: any) => {
    try {
      // Check MetaMask availability
      if (typeof window.ethereum === "undefined") {
        toast.error("MetaMask is not installed. Please install MetaMask to continue.")
        return
      }

      setIsDeploying(true)
      toast.info("Preparing to deploy to blockchain...")

      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      if (!accounts || accounts.length === 0) {
        toast.error("Please connect your MetaMask wallet")
        setIsDeploying(false)
        return
      }

      const affidavitDataForHash = createAffidavitDataForHash(affidavitRequest)
      const dataHash = generateAffidavitHash(affidavitDataForHash)

      console.log("[v0] Frontend createAffidavitDataForHash input:", JSON.stringify(affidavitRequest, null, 2))
      console.log("[v0] Frontend affidavitDataForHash:", JSON.stringify(affidavitDataForHash, null, 2))
      console.log("[v0] Frontend generated hash:", dataHash)

      // Initialize provider and contract
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xED7864989c1f88481C5Ac0242F263DC4CE2D427d"

      const contract = new ethers.Contract(contractAddress, AffidavitRegistryABI, signer)

      // Prepare contract parameters
      const witnessIds =
        affidavitRequest.witnesses?.map((w: any) => w.contactId?._id?.toString() || w.contactId?.toString() || "") || []
      const ipfsHashes = affidavitRequest.documents?.map((doc: any) => doc.ipfsHash || "") || []

      toast.info("Please confirm the transaction in MetaMask...")

      // Call contract method
      const tx = await contract.createAffidavit(
        affidavitRequest.displayId,
        affidavitRequest.title,
        affidavitRequest.category,
        affidavitRequest.description,
        affidavitRequest.declaration,
        affidavitRequest.issuerId?._id?.toString() || "",
        affidavitRequest.sellerId?._id?.toString() || "",
        affidavitRequest.buyerId?._id?.toString() || "",
        witnessIds,
        ipfsHashes,
        dataHash,
      )

      toast.info("Transaction submitted. Waiting for confirmation...")
      const receipt = await tx.wait()

      if (receipt.status === 1) {
        toast.success("Transaction confirmed! Saving to database...")

        // Call API to save to database
        const response = await fetch("/api/affidavits/affidavit-requests/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: affidavitRequest._id,
            userId: user?.id,
            activeRole: user?.activeRole,
            action: "accept",
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            displayId: affidavitRequest.displayId,
            dataHash: dataHash,
          }),
        })

        const result = await response.json()

        if (result.success) {
          toast.success("Affidavit successfully deployed to blockchain and saved!")
          await fetchAffidavitRequests()
        } else {
          toast.error(`Failed to save to database: ${result.error}`)
        }
      } else {
        toast.error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Deployment error:", error)

      if (error.code === 4001) {
        toast.error("Transaction rejected by user")
      } else if (error.code === -32603) {
        toast.error("Transaction failed: " + (error.message || "Unknown error"))
      } else {
        toast.error("Failed to deploy to blockchain: " + (error.message || "Unknown error"))
      }
    } finally {
      setIsDeploying(false)
    }
  }

  // ... (rest of the file remains unchanged)

  const handleViewProfile = async (idCard: string) => {
    try {
      const response = await fetch(`/api/user?filter=idCardNumber:${idCard}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success && data.users.length > 0) {
        router.push(`/dashboard/users/${data.users[0]._id}`)
      } else {
        toast({ title: "Error", description: "User not found", variant: "destructive" })
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to fetch user profile", variant: "destructive" })
    }
  }

  const hasUserResponded = (request: AffidavitRequest) => {
    if (!user) return false
    if (request.issuerId._id === user._id && request.issuerAccepted !== null) return true
    if (request.sellerId && request.sellerId._id === user._id && request.sellerAccepted !== null) return true
    if (request.buyerId && request.buyerId._id === user._id && request.buyerAccepted !== null) return true
    const witness = request.witnesses.find((w) => w.contactId._id === user._id)
    return witness ? Boolean(witness.hasAccepted !== null) : false
  }

  const isInitiator = (request: AffidavitRequest) => {
    if (!user) return false
    return request.createdBy._id === user._id
  }

  const allNonIssuersAccepted = (request: AffidavitRequest) => {
    const sellerAccepted = request.sellerId ? request.sellerAccepted === true : true
    const buyerAccepted = request.buyerId ? request.buyerAccepted === true : true
    const witnessesAccepted =
      request.witnesses.length > 0 ? request.witnesses.every((w) => w.hasAccepted === true) : true
    return sellerAccepted && buyerAccepted && witnessesAccepted
  }

  const isImageFile = (type: string) => {
    return type.startsWith("image/")
  }

  const renderAffidavitRequestsTable = () => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Affidavit Requests</CardTitle>
        <CardDescription>View and manage your requests</CardDescription>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search requests..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={requestStatusFilter} onValueChange={setRequestStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Issuer</TableHead>
              <TableHead>Date Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingRequests ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading requests...
                </TableCell>
              </TableRow>
            ) : filteredAffidavitRequests.length > 0 ? (
              filteredAffidavitRequests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell className="font-medium">{request.displayId}</TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{request.category}</TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleViewProfile(request.issuerId.idCardNumber)}
                  >
                    {request.issuerId.name}
                  </TableCell>
                  <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleViewRequest(request)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Show</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <AlertCircle className="h-10 w-10 mb-2" />
                    <p>No requests found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  const renderAffidavitsTable = () => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>All Affidavits</CardTitle>
        <CardDescription>
          {userRole === "Admin"
            ? "View and manage all affidavits"
            : userRole === "Issuer"
              ? "Manage your issued affidavits"
              : "View your affidavits"}
        </CardDescription>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search affidavits..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Issuer</TableHead>
              <TableHead>Date Issued</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingAffidavits ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading affidavits...
                </TableCell>
              </TableRow>
            ) : filteredAffidavits.length > 0 ? (
              filteredAffidavits.map((affidavit) => (
                <TableRow key={affidavit._id}>
                  <TableCell className="font-medium">{affidavit.displayId}</TableCell>
                  <TableCell>{affidavit.title}</TableCell>
                  <TableCell>{affidavit.category}</TableCell>
                  <TableCell>{affidavit.issuerName}</TableCell>
                  <TableCell>{new Date(affidavit.dateIssued || affidavit.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(affidavit.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Link href={`/affidavit/${affidavit.displayId}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      {(userRole === "Admin" ||
                        (userRole === "Issuer" &&
                          (typeof affidavit.issuerId === "object"
                            ? affidavit.issuerId._id === user?._id
                            : affidavit.issuerId === user?._id))) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => router.push(`/affidavit/${affidavit.displayId}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleVerifyOnBlockchain(affidavit)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span className="sr-only">Verify on Blockchain</span>
                      </Button>
                      {userRole === "Admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteClick(affidavit.displayId)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <AlertCircle className="h-10 w-10 mb-2" />
                    <p>No affidavits found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affidavits</h1>
          <p className="text-gray-500">
            {userRole === "Issuer"
              ? "View and manage affidavit requests"
              : "Manage and view all affidavits and requests"}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <FilePlus className="h-4 w-4" />
          <span>Request New Affidavit</span>
        </Button>
      </div>

      {userRole === "Issuer" ? (
        renderAffidavitRequestsTable()
      ) : (
        <Tabs defaultValue="affidavits" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="affidavits">Affidavits</TabsTrigger>
            <TabsTrigger value="affidavit-requests">Affidavit Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="affidavits">{renderAffidavitsTable()}</TabsContent>
          <TabsContent value="affidavit-requests">{renderAffidavitRequestsTable()}</TabsContent>
        </Tabs>
      )}

      <CreateAffidavitDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          fetchAffidavitRequests()
          toast({
            title: "Success",
            description: "Affidavit request created successfully",
          })
        }}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Affidavit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this affidavit? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewRequestDialogOpen} onOpenChange={setIsViewRequestDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-indigo-800">Affidavit Request Details</DialogTitle>
            <DialogDescription className="text-indigo-600">
              Review the details, documents, and acceptance status.
            </DialogDescription>
          </DialogHeader>
          {selectedAffidavitRequest && (
            <div className="space-y-6 flex-1 overflow-y-auto">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-indigo-700 mb-2">General Information</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-indigo-600 font-medium">ID</Label>
                    <p className="text-sm text-gray-700">{selectedAffidavitRequest.displayId}</p>
                  </div>
                  <div>
                    <Label className="text-indigo-600 font-medium">Title</Label>
                    <p className="text-sm text-gray-700">{selectedAffidavitRequest.title}</p>
                  </div>
                  <div>
                    <Label className="text-indigo-600 font-medium">Category</Label>
                    <p className="text-sm text-gray-700">{selectedAffidavitRequest.category}</p>
                  </div>
                  <div>
                    <Label className="text-indigo-600 font-medium">Description</Label>
                    <p className="text-sm text-gray-700">{selectedAffidavitRequest.description}</p>
                  </div>
                  <div>
                    <Label className="text-indigo-600 font-medium">Declaration</Label>
                    <p className="text-sm text-gray-700">{selectedAffidavitRequest.declaration}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-indigo-700 mb-2">Involved Parties</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-indigo-600 font-medium">Initiator</Label>
                    <p
                      className="text-sm text-gray-700 cursor-pointer"
                      onClick={() => handleViewProfile(selectedAffidavitRequest.initiatorIdCardNumber)}
                    >
                      {selectedAffidavitRequest.createdBy.name} (ID Card:{" "}
                      {selectedAffidavitRequest.initiatorIdCardNumber})
                    </p>
                  </div>
                  <div>
                    <Label className="text-indigo-600 font-medium">Issuer</Label>
                    <p
                      className="text-sm text-gray-700 cursor-pointer"
                      onClick={() => handleViewProfile(selectedAffidavitRequest.issuerId.idCardNumber)}
                    >
                      {selectedAffidavitRequest.issuerId.name} (ID Card:{" "}
                      {selectedAffidavitRequest.issuerId.idCardNumber}, Area:{" "}
                      {selectedAffidavitRequest.issuerId.area || "N/A"})
                      {selectedAffidavitRequest.issuerAccepted === true ? (
                        <CheckCircle className="inline-block h-4 w-4 ml-2 text-green-500" />
                      ) : selectedAffidavitRequest.issuerAccepted === false ? (
                        <XCircle className="inline-block h-4 w-4 ml-2 text-red-500" />
                      ) : (
                        <span className="inline-block ml-2 text-orange-500">Pending</span>
                      )}
                    </p>
                  </div>
                  {selectedAffidavitRequest.sellerId && (
                    <div>
                      <Label className="text-indigo-600 font-medium">Seller</Label>
                      <p
                        className="text-sm text-gray-700 cursor-pointer"
                        onClick={() => handleViewProfile(selectedAffidavitRequest.sellerId.idCardNumber)}
                      >
                        {selectedAffidavitRequest.sellerId.name} (ID Card:{" "}
                        {selectedAffidavitRequest.sellerId.idCardNumber})
                        {selectedAffidavitRequest.sellerAccepted === true ? (
                          <CheckCircle className="inline-block h-4 w-4 ml-2 text-green-500" />
                        ) : selectedAffidavitRequest.sellerAccepted === false ? (
                          <XCircle className="inline-block h-4 w-4 ml-2 text-red-500" />
                        ) : (
                          <span className="inline-block ml-2 text-orange-500">Pending</span>
                        )}
                      </p>
                    </div>
                  )}
                  {selectedAffidavitRequest.buyerId && (
                    <div>
                      <Label className="text-indigo-600 font-medium">Buyer</Label>
                      <p
                        className="text-sm text-gray-700 cursor-pointer"
                        onClick={() => handleViewProfile(selectedAffidavitRequest.buyerId.idCardNumber)}
                      >
                        {selectedAffidavitRequest.buyerId.name} (ID Card:{" "}
                        {selectedAffidavitRequest.buyerId.idCardNumber})
                        {selectedAffidavitRequest.buyerAccepted === true ? (
                          <CheckCircle className="inline-block h-4 w-4 ml-2 text-green-500" />
                        ) : selectedAffidavitRequest.buyerAccepted === false ? (
                          <XCircle className="inline-block h-4 w-4 ml-2 text-red-500" />
                        ) : (
                          <span className="inline-block ml-2 text-orange-500">Pending</span>
                        )}
                      </p>
                    </div>
                  )}
                  {selectedAffidavitRequest.witnesses.length > 0 && (
                    <div>
                      <Label className="text-indigo-600 font-medium">Witnesses</Label>
                      {selectedAffidavitRequest.witnesses.map((witness, index) => (
                        <p
                          key={index}
                          className="text-sm text-gray-700 cursor-pointer"
                          onClick={() => handleViewProfile(witness.contactId.idCardNumber)}
                        >
                          {witness.contactId.name} (ID Card: {witness.contactId.idCardNumber})
                          {witness.hasAccepted === true ? (
                            <CheckCircle className="inline-block h-4 w-4 ml-2 text-green-500" />
                          ) : witness.hasAccepted === false ? (
                            <XCircle className="inline-block h-4 w-4 ml-2 text-red-500" />
                          ) : (
                            <span className="inline-block ml-2 text-orange-500">Pending</span>
                          )}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-indigo-700 mb-2">Documents</h3>
                {selectedAffidavitRequest.documents && selectedAffidavitRequest.documents.length > 0 ? (
                  <div className="space-y-4">
                    {selectedAffidavitRequest.documents.map((doc, index) => (
                      <div key={index} className="flex flex-col gap-2">
                        {isImageFile(doc.type) ? (
                          <>
                            <img
                              src={doc.url || "/placeholder.svg"}
                              alt={doc.name}
                              className="max-w-full h-auto rounded-md shadow-sm"
                              style={{ maxHeight: "200px", objectFit: "contain" }}
                            />
                            <a
                              href={doc.url}
                              download={doc.name}
                              className="text-indigo-600 hover:underline flex items-center gap-1 text-sm"
                            >
                              <Download className="h-4 w-4" />
                              Download {doc.name}
                            </a>
                          </>
                        ) : (
                          <a
                            href={doc.url}
                            download={doc.name}
                            className="text-indigo-600 hover:underline flex items-center gap-1 text-sm"
                          >
                            <Download className="h-4 w-4" />
                            Download {doc.name} ({doc.type})
                          </a>
                        )}
                        {doc.ipfsHash && <p className="text-xs text-gray-500">IPFS: {doc.ipfsHash.slice(0, 10)}...</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">No documents available.</p>
                )}
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-indigo-700 mb-2">Status</h3>
                <div className="text-sm text-gray-700">{getStatusBadge(selectedAffidavitRequest.status)}</div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-center sm:space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsViewRequestDialogOpen(false)}
              disabled={isProcessingBlockchain}
            >
              Close
            </Button>
            {selectedAffidavitRequest &&
              user &&
              !hasUserResponded(selectedAffidavitRequest) &&
              !isInitiator(selectedAffidavitRequest) &&
              !isProcessingBlockchain &&
              (userRole === "Issuer" && selectedAffidavitRequest.issuerId._id === user._id ? (
                allNonIssuersAccepted(selectedAffidavitRequest) && selectedAffidavitRequest.status === "pending" ? (
                  <>
                    <Button
                      onClick={() => handleRespondRequest("accept")}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      disabled={isProcessingBlockchain}
                    >
                      Accept and Deploy to Blockchain
                    </Button>
                    <Button
                      onClick={() => handleRespondRequest("reject")}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      disabled={isProcessingBlockchain}
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <p className="text-red-500 text-sm mt-2">You can only accept if all parties accept this affidavit.</p>
                )
              ) : (
                selectedAffidavitRequest.status === "pending" && (
                  <>
                    <Button
                      onClick={() => handleRespondRequest("accept")}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      disabled={isProcessingBlockchain}
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleRespondRequest("reject")}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      disabled={isProcessingBlockchain}
                    >
                      Reject
                    </Button>
                  </>
                )
              ))}
            {isProcessingBlockchain && (
              <p className="text-blue-500 text-sm mt-2">Processing blockchain transaction. Please wait...</p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Verify on Blockchain</DialogTitle>
            <DialogDescription>Verification results for affidavit {selectedAffidavit?.displayId}</DialogDescription>
          </DialogHeader>
          {isProcessingBlockchain ? (
            <p className="text-blue-500">Verifying on blockchain, please wait...</p>
          ) : verificationResult ? (
            <div className="space-y-4">
              <div>
                <Label className="font-medium">
                  {verificationResult.isVerified ? (
                    <span className="text-green-500">Active and Authentic</span>
                  ) : (
                    <span className="text-red-500">Verification Failed</span>
                  )}
                </Label>
                <p>{verificationResult.message}</p>
              </div>
              {verificationResult.blockchainData && (
                <div>
                  <h3 className="text-lg font-semibold">Original Blockchain Data</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>IPFS Hash:</strong> {verificationResult.blockchainData.ipfsHashes[0] || "N/A"}
                    </p>
                    <p>
                      <strong>Title:</strong> {verificationResult.blockchainData.title}
                    </p>
                    <p>
                      <strong>Category:</strong> {verificationResult.blockchainData.category}
                    </p>
                    <p>
                      <strong>Description:</strong> {verificationResult.blockchainData.description}
                    </p>
                    <p>
                      <strong>Declaration:</strong> {verificationResult.blockchainData.declaration}
                    </p>
                    <p>
                      <strong>Issuer ID:</strong> {verificationResult.blockchainData.issuerId}
                    </p>
                    <p>
                      <strong>Seller ID:</strong> {verificationResult.blockchainData.sellerId}
                    </p>
                    <p>
                      <strong>Buyer ID:</strong> {verificationResult.blockchainData.buyerId}
                    </p>
                    <p>
                      <strong>Witnesses:</strong> {verificationResult.blockchainData.witnessIds?.join(", ") || "None"}
                    </p>
                    <p>
                      <strong>Data Hash:</strong> {verificationResult.blockchainData.dataHash}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p>No verification data available.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
