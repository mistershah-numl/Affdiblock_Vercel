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
  witnesses: Array<{ contactId: { _id: string; name: string; idCardNumber: string }; hasAccepted: boolean | null }>
  documents: Array<{ url: string; name: string; type: string }>
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
  description: string
  declaration: string
  dateRequested: string
  dateIssued: string
  status: string
  transactionHash?: string
  blockNumber?: number
  createdAt: string
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
  const [selectedAffidavitId, setSelectedAffidavitId] = useState<string | null>(null)
  const [selectedAffidavitRequest, setSelectedAffidavitRequest] = useState<AffidavitRequest | null>(null)
  const [affidavitRequests, setAffidavitRequests] = useState<AffidavitRequest[]>([])
  const [affidavits, setAffidavits] = useState<Affidavit[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  const [isLoadingAffidavits, setIsLoadingAffidavits] = useState(true)
  const [isProcessingBlockchain, setIsProcessingBlockchain] = useState(false)

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
      console.error("Error fetching affidavit requests:", {
        message: error.message,
        status: error.status,
      })
      setAffidavitRequests([])
      toast({
        title: "Error",
        description: error.message || "Failed to fetch affidavit requests. Please try again later.",
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
        toast({
          title: "Error",
          description: data.error || "Failed to fetch affidavits",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error fetching affidavits:", {
        message: error.message,
        status: error.status,
      })
      setAffidavits([])
      toast({
        title: "Error",
        description: error.message || "Failed to fetch affidavits. Please try again later.",
        variant: "destructive",
      })
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
        toast({
          title: "Success",
          description: "Affidavit deleted successfully",
        })
        fetchAffidavits()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete affidavit",
          variant: "destructive",
        })
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

  const handleRespondRequest = async (action: "accept" | "reject") => {
    if (!selectedAffidavitRequest || !user?._id) return

    try {
      const isAccepted = action === "accept"

      // For non-issuer roles or reject action, just update the request status
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

        // Update local state
        setAffidavitRequests((prev) =>
          prev.map((req) =>
            req._id === selectedAffidavitRequest._id ? { ...req, status: isAccepted ? "accepted" : "rejected" } : req,
          ),
        )

        await Promise.all([fetchAffidavitRequests(), fetchAffidavits()])
        setIsViewRequestDialogOpen(false)
        return
      }

      // For issuer accepting, handle the blockchain transaction
      setIsProcessingBlockchain(true)

      // Step 1: Create the affidavit in the database (without blockchain details)
      toast({
        title: "Processing",
        description: "Creating affidavit record...",
        duration: 3000,
      })

      const initialResponse = await fetch("/api/affidavits/affidavit-requests/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requestId: selectedAffidavitRequest._id,
          userId: user._id,
          activeRole: user.activeRole,
          action,
        }),
      })

      const initialResult = await initialResponse.json()
      if (!initialResponse.ok || !initialResult.success) {
        throw new Error(initialResult.error || `Failed to ${action} the request`)
      }

      const affidavitData = initialResult.affidavitData
      if (!affidavitData) {
        throw new Error("Affidavit data not returned from API")
      }

      // Step 2: Deploy to blockchain
      toast({
        title: "Processing",
        description: "Deploying to blockchain. Please confirm the transaction in MetaMask...",
        duration: 5000,
      })

      if (!window.ethereum) {
        throw new Error("MetaMask is not installed or not running in a browser environment")
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      await window.ethereum.request({ method: "eth_requestAccounts" })
      const signer = await provider.getSigner()
      const contractAddress = "0x2444c02943aA4f09D2C63D607f82668413F713d6"
      const contract = new ethers.Contract(
        contractAddress,
        [
          "function createAffidavit(string memory _affidavitId, string memory _title, string memory _category, string memory _description, string memory _declaration, address _issuer, address _seller, address _buyer, string[] memory _witnessIds, string memory _ipfsHash) public",
        ],
        signer,
      )

      // Since the contract expects addresses but we only store ID card numbers, pass zero addresses
      const zeroAddress = "0x0000000000000000000000000000000000000000"
      const witnessIds = affidavitData.witnessIds.length > 0 ? affidavitData.witnessIds : ["0"]
      const ipfsHash = affidavitData.ipfsHash || ""

      console.log("Blockchain Deployment Data:", {
        affidavitId: affidavitData.affidavitId,
        title: affidavitData.title,
        category: affidavitData.category,
        description: affidavitData.description,
        declaration: affidavitData.declaration,
        issuer: zeroAddress,
        seller: zeroAddress,
        buyer: zeroAddress,
        witnessIds,
        ipfsHash,
      })

      const gasEstimate = await contract.createAffidavit
        .estimateGas(
          affidavitData.affidavitId,
          affidavitData.title,
          affidavitData.category,
          affidavitData.description,
          affidavitData.declaration,
          zeroAddress, // issuer
          zeroAddress, // seller
          zeroAddress, // buyer
          witnessIds,
          ipfsHash,
          { from: await signer.getAddress() },
        )
        .catch((err: any) => {
          console.error("Gas estimation failed:", err)
          throw new Error("Gas estimation failed: " + err.message)
        })

      const gasLimit = Math.floor(Number(gasEstimate) * 1.2)

      toast({
        title: "Processing",
        description: "Sending transaction to blockchain...",
        duration: 5000,
      })

      const tx = await contract.createAffidavit(
        affidavitData.affidavitId,
        affidavitData.title,
        affidavitData.category,
        affidavitData.description,
        affidavitData.declaration,
        zeroAddress, // issuer
        zeroAddress, // seller
        zeroAddress, // buyer
        witnessIds,
        ipfsHash,
        { gasLimit },
      )

      console.log("Transaction sent, hash:", tx.hash)

      toast({
        title: "Processing",
        description: "Transaction sent. Waiting for confirmation...",
        duration: 10000,
      })

      // Step 3: Wait for transaction confirmation
      const receipt = await tx.wait(1)
      console.log("Transaction confirmed:", receipt)

      if (!receipt || !receipt.hash) {
        throw new Error("Failed to get transaction receipt")
      }

      const transactionHash = receipt.hash
      const blockNumber = Number(receipt.blockNumber)

      // Step 4: Update the affidavit with blockchain details
      toast({
        title: "Processing",
        description: "Updating affidavit with blockchain details...",
        duration: 3000,
      })

      const updateResponse = await fetch("/api/affidavits/affidavit-requests/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requestId: selectedAffidavitRequest._id,
          userId: user._id,
          activeRole: user.activeRole,
          action,
          transactionHash,
          blockNumber,
          affidavitId: affidavitData.affidavitId,
        }),
      })

      const updateResult = await updateResponse.json()
      if (!updateResponse.ok || !updateResult.success) {
        console.error("Failed to update blockchain details:", updateResult)
        throw new Error("Transaction confirmed, but failed to update affidavit with blockchain details")
      }

      // Update local state
      setAffidavitRequests((prev) =>
        prev.map((req) =>
          req._id === selectedAffidavitRequest._id ? { ...req, status: "accepted", issuerAccepted: true } : req,
        ),
      )

      toast({
        title: "Success",
        description: "Affidavit accepted and deployed to blockchain successfully",
        variant: "default",
      })

      await Promise.all([fetchAffidavitRequests(), fetchAffidavits()])
      setIsViewRequestDialogOpen(false)
    } catch (error: any) {
      console.error(`Error ${action}ing request:`, error)
      toast({
        title: "Error",
        description: `Transaction failed: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsProcessingBlockchain(false)
    }
  }

  const handleViewProfile = async (idCard: string) => {
    try {
      const response = await fetch(`/api/user?filter=idCardNumber:${idCard}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch user profile",
        variant: "destructive",
      })
    }
  }

  const hasUserResponded = (request: AffidavitRequest) => {
    if (!user) return false
    if (request.issuerId._id === user._id && request.issuerAccepted !== null) return true
    if (request.sellerId && request.sellerId._id === user._id && request.sellerAccepted !== null) return true
    if (request.buyerId && request.buyerId._id === user._id && request.buyerAccepted !== null) return true
    const witness = request.witnesses.find((w) => w.contactId._id === user._id)
    return witness ? witness.hasAccepted !== null : false
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
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
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

      <CreateAffidavitDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Affidavit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this affidavit? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center sm:space-x-2">
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
            <Button variant="outline" onClick={() => setIsViewRequestDialogOpen(false)}>
              Close
            </Button>
            {selectedAffidavitRequest &&
              user &&
              !hasUserResponded(selectedAffidavitRequest) &&
              !isInitiator(selectedAffidavitRequest) &&
              !isProcessingBlockchain &&
              (userRole === "Issuer" && selectedAffidavitRequest.issuerId._id === user._id ? (
                allNonIssuersAccepted(selectedAffidavitRequest) ? (
                  <>
                    <Button
                      onClick={() => handleRespondRequest("accept")}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleRespondRequest("reject")}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <p className="text-red-500 text-sm mt-2">You can only accept if all parties accept this affidavit.</p>
                )
              ) : (
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
              ))}
            {isProcessingBlockchain && (
              <p className="text-blue-500 text-sm mt-2">Processing blockchain transaction. Please wait...</p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}