"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Filter, Edit, Trash2, Eye, AlertCircle, FilePlus, CheckCircle, XCircle } from "lucide-react"
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

interface Affidavit {
  id: string
  title: string
  category: string
  issuer: string
  issuerId: string
  dateRequested: string
  dateIssued: string | null
  status: string
  parties: Array<{ role: string; name: string; idCard: string }>
  witnesses: Array<{ name: string; idCard: string }>
  userId: string
}

interface AffidavitRequest {
  _id: string
  title: string
  category: string
  issuerId: { name: string }
  description: string
  declaration: string
  userRole: string
  sellerId?: { name: string; idCardNumber: string }
  sellerAccepted: boolean
  buyerId?: { name: string; idCardNumber: string }
  buyerAccepted: boolean
  witnesses: Array<{ contactId: { name: string; idCardNumber: string }; hasAccepted: boolean }>
  documents: Array<{ url: string; name: string; type: string }>
  details: Record<string, string | number>
  createdBy: { name: string; idCardNumber: string }
  initiatorIdCardNumber: string
  status: string
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
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)

  // Mock user role - in a real app, this would come from authentication
  const userRole = user?.activeRole || "User"

  // Mock affidavits data
  const affidavits: Affidavit[] = [
    {
      id: "AFF-2025-001",
      title: "Property Transfer Deed",
      category: "Property",
      issuer: "Legal Office - Islamabad",
      issuerId: "issuer1",
      dateRequested: "2025-03-10",
      dateIssued: "2025-03-12",
      status: "Active",
      parties: [
        { role: "Buyer", name: "John Doe", idCard: "12345-6789012-3" },
        { role: "Seller", name: "Jane Smith", idCard: "98765-4321098-7" },
      ],
      witnesses: [
        { name: "Witness 1", idCard: "11111-2222222-3" },
        { name: "Witness 2", idCard: "44444-5555555-6" },
      ],
      userId: user?._id || "user1",
    },
    {
      id: "AFF-2025-002",
      title: "Vehicle Ownership Transfer",
      category: "Vehicle",
      issuer: "Notary Services - Lahore",
      issuerId: "issuer2",
      dateRequested: "2025-03-08",
      dateIssued: null,
      status: "Pending",
      parties: [
        { role: "Buyer", name: "Mike Johnson", idCard: "13579-2468013-5" },
        { role: "Seller", name: "Sarah Williams", idCard: "24680-1357924-6" },
      ],
      witnesses: [{ name: "Witness 3", idCard: "22222-3333333-4" }],
      userId: "user2",
    },
    {
      id: "AFF-2025-003",
      title: "Business Partnership Agreement",
      category: "Business",
      issuer: "Legal Office - Islamabad",
      issuerId: "issuer1",
      dateRequested: "2025-03-05",
      dateIssued: "2025-03-07",
      status: "Active",
      parties: [
        { role: "Partner 1", name: "Robert Brown", idCard: "54321-6789054-3" },
        { role: "Partner 2", name: "Lisa Davis", idCard: "65432-1098765-4" },
      ],
      witnesses: [
        { name: "Witness 4", idCard: "33333-4444444-5" },
        { name: "Witness 5", idCard: "55555-6666666-7" },
      ],
      userId: user?._id || "user1",
    },
    {
      id: "AFF-2025-004",
      title: "Rental Agreement",
      category: "Property",
      issuer: "Government Stamp Office - Karachi",
      issuerId: "issuer3",
      dateRequested: "2025-03-01",
      dateIssued: null,
      status: "Rejected",
      parties: [
        { role: "Landlord", name: "David Wilson", idCard: "97531-0246897-5" },
        { role: "Tenant", name: "Emma Taylor", idCard: "86420-9753186-4" },
      ],
      witnesses: [],
      userId: "user3",
    },
    {
      id: "AFF-2025-005",
      title: "Motorcycle Sale Agreement",
      category: "Vehicle",
      issuer: "Notary Services - Lahore",
      issuerId: "issuer2",
      dateRequested: "2025-02-28",
      dateIssued: "2025-03-02",
      status: "Revoked",
      parties: [
        { role: "Buyer", name: "Alex Martin", idCard: "36925-8147036-9" },
        { role: "Seller", name: "Olivia Moore", idCard: "25814-7036925-8" },
      ],
      witnesses: [{ name: "Witness 6", idCard: "66666-7777777-8" }],
      userId: user?._id || "user1",
    },
  ]

  // Fetch affidavit requests when the component mounts
  useEffect(() => {
    if (user?._id) {
      fetchAffidavitRequests()
    } else {
      setIsLoadingRequests(false)
      setAffidavitRequests([])
    }
  }, [user?._id])

  const fetchAffidavitRequests = async () => {
    setIsLoadingRequests(true)
    try {
      const response = await fetch(`/api/affidavits/affidavit-requests/get?userId=${user?._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
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
    } catch (error) {
      console.error("Error fetching affidavit requests:", error)
      setAffidavitRequests([]) // Set to empty array instead of crashing
      toast({
        title: "Error",
        description: "No affidavit requests found for your ID",
        variant: "destructive",
      })
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
      case "approved":
        return <Badge className="bg-green-500">Active</Badge>
      case "Pending":
      case "pending":
        return (
          <Badge variant="outline" className="text-orange-500 border-orange-500">
            Pending
          </Badge>
        )
      case "Rejected":
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "Revoked":
        return (
          <Badge variant="secondary" className="bg-gray-500 text-white">
            Revoked
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Filter affidavits based on search query, status, and category
  const filteredAffidavits = affidavits.filter((affidavit) => {
    // For regular users, only show their own affidavits
    if (userRole === "User" && affidavit.userId !== user?._id) {
      return false
    }

    // For issuers, only show affidavits they issued
    if (userRole === "Issuer" && affidavit.issuerId !== "issuer1") {
      return false
    }

    // Apply search filter
    const matchesSearch =
      affidavit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.parties.some(
        (party) =>
          party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          party.idCard.toLowerCase().includes(searchQuery.toLowerCase()),
      )

    // Apply status filter
    const matchesStatus = statusFilter === "all" || affidavit.status.toLowerCase() === statusFilter.toLowerCase()

    // Apply category filter
    const matchesCategory =
      categoryFilter === "all" || affidavit.category.toLowerCase() === categoryFilter.toLowerCase()

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Filter affidavit requests based on search query and status
  const filteredAffidavitRequests = affidavitRequests.filter((request) => {
    // Apply search filter
    const matchesSearch =
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.issuerId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.sellerId?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.buyerId?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.witnesses.some((witness) =>
        witness.contactId.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )

    // Apply status filter
    const matchesStatus =
      requestStatusFilter === "all" || request.status.toLowerCase() === requestStatusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const handleDeleteClick = (id: string) => {
    setSelectedAffidavitId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    console.log(`Deleting affidavit ${selectedAffidavitId}`)
    setIsDeleteDialogOpen(false)
    setSelectedAffidavitId(null)
  }

  const handleViewRequest = (request: AffidavitRequest) => {
    setSelectedAffidavitRequest(request)
    setIsViewRequestDialogOpen(true)
  }

  const handleAcceptRequest = async () => {
    if (!selectedAffidavitRequest || !user?._id) return

    // Determine the user's role in this affidavit request
    let role = ""
    if (selectedAffidavitRequest.sellerId && selectedAffidavitRequest.sellerId.name === user.name) {
      role = "seller"
    } else if (selectedAffidavitRequest.buyerId && selectedAffidavitRequest.buyerId.name === user.name) {
      role = "buyer"
    } else if (
      selectedAffidavitRequest.witnesses.some((w) => w.contactId.name === user.name)
    ) {
      role = "witness"
    } else {
      toast({
        title: "Error",
        description: "You are not a participant in this affidavit request.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/affidavits/affidavit-requests/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: selectedAffidavitRequest._id,
          userId: user._id,
          role,
          action: "accept",
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: "You have successfully accepted the affidavit request.",
        })
        // Refresh the affidavit requests
        fetchAffidavitRequests()
        setIsViewRequestDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to accept the affidavit request.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error accepting affidavit request:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while accepting the affidavit request.",
        variant: "destructive",
      })
    }
  }

  // Check if the user has already accepted the request
  const hasUserAccepted = (request: AffidavitRequest) => {
    if (request.sellerId && request.sellerId.name === user?.name) {
      return request.sellerAccepted
    }
    if (request.buyerId && request.buyerId.name === user?.name) {
      return request.buyerAccepted
    }
    const witness = request.witnesses.find((w) => w.contactId.name === user?.name)
    if (witness) {
      return witness.hasAccepted
    }
    return false
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affidavits</h1>
          <p className="text-gray-500">Manage and view all affidavits and requests</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <FilePlus className="h-4 w-4" />
          <span>Request New Affidavit</span>
        </Button>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="affidavits" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="affidavits">Affidavits</TabsTrigger>
          <TabsTrigger value="affidavit-requests">Affidavit Requests</TabsTrigger>
        </TabsList>

        {/* Affidavits Tab */}
        <TabsContent value="affidavits">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>All Affidavits</CardTitle>
              <CardDescription>
                {userRole === "Admin"
                  ? "View and manage all affidavits in the system"
                  : userRole === "Issuer"
                  ? "View and manage affidavits you've issued"
                  : "View your affidavits and their status"}
              </CardDescription>

              {/* Filters Section */}
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
                    <TableHead>Date Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffidavits.length > 0 ? (
                    filteredAffidavits.map((affidavit) => (
                      <TableRow key={affidavit.id}>
                        <TableCell className="font-medium">{affidavit.id}</TableCell>
                        <TableCell>{affidavit.title}</TableCell>
                        <TableCell>{affidavit.category}</TableCell>
                        <TableCell>{affidavit.issuer}</TableCell>
                        <TableCell>{affidavit.dateRequested}</TableCell>
                        <TableCell>{getStatusBadge(affidavit.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Link href={`/affidavit/${affidavit.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Link>
                            </Button>

                            {(userRole === "Admin" || (userRole === "Issuer" && affidavit.issuerId === "issuer1")) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => router.push(`/affidavit/${affidavit.id}/edit`)}
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
                                onClick={() => handleDeleteClick(affidavit.id)}
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
                          <p>No affidavits found matching your search criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Affidavit Requests Tab */}
        <TabsContent value="affidavit-requests">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Affidavit Requests</CardTitle>
              <CardDescription>
                View and manage your affidavit requests
              </CardDescription>

              {/* Filters Section */}
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search affidavit requests..."
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
                      <SelectItem value="approved">Approved</SelectItem>
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
                        Loading affidavit requests...
                      </TableCell>
                    </TableRow>
                  ) : filteredAffidavitRequests.length > 0 ? (
                    filteredAffidavitRequests.map((request) => (
                      <TableRow key={request._id}>
                        <TableCell className="font-medium">{request._id}</TableCell>
                        <TableCell>{request.title}</TableCell>
                        <TableCell>{request.category}</TableCell>
                        <TableCell>{request.issuerId.name}</TableCell>
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
                          <p>No affidavit requests found for your ID</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Affidavit Dialog */}
      <CreateAffidavitDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Affidavit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this affidavit? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Affidavit Request Dialog */}
      <Dialog open={isViewRequestDialogOpen} onOpenChange={setIsViewRequestDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Affidavit Request Details</DialogTitle>
            <DialogDescription>
              View the details of the affidavit request and acceptance status.
            </DialogDescription>
          </DialogHeader>
          {selectedAffidavitRequest && (
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div>
                <Label>ID</Label>
                <p className="text-sm text-gray-500">{selectedAffidavitRequest._id}</p>
              </div>
              <div>
                <Label>Title</Label>
                <p className="text-sm text-gray-500">{selectedAffidavitRequest.title}</p>
              </div>
              <div>
                <Label>Category</Label>
                <p className="text-sm text-gray-500">{selectedAffidavitRequest.category}</p>
              </div>
              <div>
                <Label>Issuer</Label>
                <p className="text-sm text-gray-500">{selectedAffidavitRequest.issuerId.name}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-500">{selectedAffidavitRequest.description}</p>
              </div>
              <div>
                <Label>Declaration</Label>
                <p className="text-sm text-gray-500">{selectedAffidavitRequest.declaration}</p>
              </div>
              <div>
                <Label>Initiator</Label>
                <p className="text-sm text-gray-500">
                  {selectedAffidavitRequest.createdBy.name} (ID Card: {selectedAffidavitRequest.initiatorIdCardNumber})
                </p>
              </div>
              {selectedAffidavitRequest.sellerId && (
                <div>
                  <Label>Seller</Label>
                  <p className="text-sm text-gray-500">
                    {selectedAffidavitRequest.sellerId.name} (ID Card: {selectedAffidavitRequest.sellerId.idCardNumber})
                    {selectedAffidavitRequest.sellerAccepted ? (
                      <CheckCircle className="inline-block h-4 w-4 ml-2 text-green-500" />
                    ) : (
                      <XCircle className="inline-block h-4 w-4 ml-2 text-red-500" />
                    )}
                  </p>
                </div>
              )}
              {selectedAffidavitRequest.buyerId && (
                <div>
                  <Label>Buyer</Label>
                  <p className="text-sm text-gray-500">
                    {selectedAffidavitRequest.buyerId.name} (ID Card: {selectedAffidavitRequest.buyerId.idCardNumber})
                    {selectedAffidavitRequest.buyerAccepted ? (
                      <CheckCircle className="inline-block h-4 w-4 ml-2 text-green-500" />
                    ) : (
                      <XCircle className="inline-block h-4 w-4 ml-2 text-red-500" />
                    )}
                  </p>
                </div>
              )}
              {selectedAffidavitRequest.witnesses.length > 0 && (
                <div>
                  <Label>Witnesses</Label>
                  {selectedAffidavitRequest.witnesses.map((witness, index) => (
                    <p key={index} className="text-sm text-gray-500">
                      {witness.contactId.name} (ID Card: {witness.contactId.idCardNumber})
                      {witness.hasAccepted ? (
                        <CheckCircle className="inline-block h-4 w-4 ml-2 text-green-500" />
                      ) : (
                        <XCircle className="inline-block h-4 w-4 ml-2 text-red-500" />
                      )}
                    </p>
                  ))}
                </div>
              )}
              <div>
                <Label>Status</Label>
                <p className="text-sm text-gray-500">{selectedAffidavitRequest.status}</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" onClick={() => setIsViewRequestDialogOpen(false)}>
              Close
            </Button>
            {selectedAffidavitRequest && !hasUserAccepted(selectedAffidavitRequest) && (
              <Button onClick={handleAcceptRequest}>Accept</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}