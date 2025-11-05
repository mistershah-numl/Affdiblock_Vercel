"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Eye,
  MoreHorizontal,
  Search,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  Building,
  MapPin,
  Loader2,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

interface IssuerRequest {
  _id: string
  userId: { _id: string; name: string; email: string; idCardNumber?: string }
  licenseUrl: string
  organization: string
  city: string
  designation: string
  dateOfJoining: string
  status: string
  remarks?: string
  createdAt: string
}

export default function IssuerRequestsPage() {
  const router = useRouter()
  const { user, token, isLoading, isAuthenticated } = useAuth()
  const [requests, setRequests] = useState<IssuerRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<IssuerRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  const [isDocumentLoading, setIsDocumentLoading] = useState(false)
  const [documentType, setDocumentType] = useState<"image" | "pdf" | null>(null)

  // Review dialog state
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<IssuerRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")

  // Document preview dialog
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<{ title: string; url: string } | null>(null)

  // Debug auth state
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      console.log("🔍 Auth state:", {
        userId: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        activeRole: user.activeRole,
        tokenLength: token?.length || 0
      })
    }
  }, [isLoading, isAuthenticated, user, token])

  // Ensure admin access
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.activeRole !== "Admin")) {
      console.log("❌ Access denied:", {
        isAuthenticated,
        activeRole: user?.activeRole,
        roles: user?.roles
      })
      toast({
        title: "Access Denied",
        description: "Only admins can access this page.",
        variant: "destructive",
      })
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, user, router])

  // Fetch issuer requests
  useEffect(() => {
    if (token && isAuthenticated && user?.activeRole === "Admin") {
      fetchRequests()
    }
  }, [token, isAuthenticated, user])

  const fetchRequests = async () => {
    setIsLoadingRequests(true)
    try {
      const response = await fetch("/api/issuer-requests", {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log("📡 Fetch issuer requests response status:", response.status)
      const data = await response.json()
      console.log("📋 Fetch issuer requests data:", {
        success: data.success,
        dataLength: data.data?.length || 0
      })

      if (data.success) {
        const mappedRequests = data.data.map((req: any) => ({
          _id: req._id,
          userId: {
            _id: req.user._id,
            name: req.user.name || "Unknown",
            email: req.user.email || "Unknown",
            idCardNumber: req.user.idCardNumber || "N/A",
          },
          licenseUrl: req.licenseUrl,
          organization: req.organization,
          city: req.city,
          designation: req.designation,
          dateOfJoining: req.dateOfJoining,
          status: req.status,
          remarks: req.remarks,
          createdAt: req.createdAt,
        }))
        setRequests(mappedRequests)
        setFilteredRequests(mappedRequests)
        console.log("✅ Requests fetched:", mappedRequests.length)
      } else {
        console.log("❌ Fetch failed:", data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to fetch issuer requests",
          variant: "destructive",
        })
        setRequests([])
        setFilteredRequests([])
      }
    } catch (error: any) {
      console.error("💥 Error fetching issuer requests:", {
        message: error.message,
        stack: error.stack
      })
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching issuer requests",
        variant: "destructive",
      })
      setRequests([])
      setFilteredRequests([])
    } finally {
      setIsLoadingRequests(false)
    }
  }

  // Filter requests based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = requests.filter(
        (request) =>
          request.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.userId.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.designation.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredRequests(filtered)
    } else {
      setFilteredRequests(requests)
    }
  }, [searchQuery, requests])

  const handleViewUser = (userId: string) => {
    console.log("👀 Viewing user:", userId)
    router.push(`/dashboard/users/${userId}`)
  }

  const handleOpenReviewDialog = (request: IssuerRequest) => {
    console.log("📝 Opening review dialog for request:", request._id)
    setSelectedRequest(request)
    setReviewNotes(request.remarks || "")
    setIsReviewDialogOpen(true)
  }

  const handleApproveRequest = async () => {
    if (!selectedRequest || !token) return

    console.log("✅ Initiating approve request:", selectedRequest._id)
    try {
      const response = await fetch("/api/issuer-requests/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId: selectedRequest._id }),
      })
      const data = await response.json()
      console.log("📡 Approve response:", {
        status: response.status,
        success: data.success,
        error: data.error
      })

      if (data.success) {
        toast({
          title: "Success",
          description: "Issuer request approved",
          variant: "default",
        })
        // Update local state
        const updatedRequests = requests.map((request) =>
          request._id === selectedRequest._id ? { ...request, status: "Approved" } : request,
        )
        setRequests(updatedRequests)
        setFilteredRequests(updatedRequests)
        setIsReviewDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to approve issuer request",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("💥 Error approving issuer request:", {
        message: error.message,
        stack: error.stack
      })
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleRejectRequest = async () => {
    if (!selectedRequest || !reviewNotes || !token) return

    console.log("❌ Initiating reject request:", selectedRequest._id, { remarks: reviewNotes })
    try {
      const response = await fetch("/api/issuer-requests/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId: selectedRequest._id, remarks: reviewNotes }),
      })
      const data = await response.json()
      console.log("📡 Reject response:", {
        status: response.status,
        success: data.success,
        error: data.error
      })

      if (data.success) {
        toast({
          title: "Success",
          description: "Issuer request rejected",
          variant: "default",
        })
        // Update local state
        const updatedRequests = requests.map((request) =>
          request._id === selectedRequest._id ? { ...request, status: "Rejected", remarks: reviewNotes } : request,
        )
        setRequests(updatedRequests)
        setFilteredRequests(updatedRequests)
        setIsReviewDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reject issuer request",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("💥 Error rejecting issuer request:", {
        message: error.message,
        stack: error.stack
      })
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleViewDocument = async (title: string, url: string) => {
    console.log("📄 Viewing document:", { title, url })
    setIsDocumentLoading(true)
    setPreviewDocument({ title, url })
    setIsDocumentPreviewOpen(true)

    // Determine file type
    try {
      const response = await fetch(url, { method: "HEAD" })
      const contentType = response.headers.get("content-type")
      console.log("📋 Document content-type:", contentType)
      setDocumentType(contentType?.includes("pdf") ? "pdf" : "image")
    } catch (error) {
      console.error("💥 Error fetching document metadata:", error)
      // Fallback to extension-based check
      setDocumentType(url.toLowerCase().endsWith(".pdf") ? "pdf" : "image")
    } finally {
      setIsDocumentLoading(false)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    console.log("🗑️ Initiating delete request:", requestId)
    try {
      const response = await fetch("/api/issuer-requests/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      })
      const data = await response.json()
      console.log("📡 Delete response:", {
        status: response.status,
        success: data.success,
        error: data.error
      })

      if (data.success) {
        toast({
          title: "Success",
          description: "Issuer request deleted",
          variant: "default",
        })
        // Refresh the requests list
        fetchRequests()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete issuer request",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("💥 Error deleting issuer request:", {
        message: error.message,
        stack: error.stack
      })
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issuer Requests</h1>
          <p className="text-gray-500">Review and manage requests to become an issuer</p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search requests..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Issuer Requests Table Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Issuer Applications</CardTitle>
          <CardDescription>Applications from users who want to become issuers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Date of Joining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingRequests ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading requests...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No issuer requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell className="font-medium">{request.userId.name}</TableCell>
                    <TableCell>{request.userId.email}</TableCell>
                    <TableCell>{request.organization}</TableCell>
                    <TableCell>{request.city}</TableCell>
                    <TableCell>{request.designation}</TableCell>
                    <TableCell>{new Date(request.dateOfJoining).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewUser(request.userId._id)}>
                            View Applicant
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewDocument("License Document", request.licenseUrl)}>
                            View License
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenReviewDialog(request)}>
                            Review Application
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteRequest(request._id)}
                            className="text-red-600"
                          >
                            Delete Request
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Issuer Application</DialogTitle>
            <DialogDescription>Review the application details and make a decision.</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-500">Applicant</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium">{selectedRequest.userId.name}</div>
                        <div className="text-sm text-gray-500">{selectedRequest.userId.email}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">ID Card Number</Label>
                    <div className="font-medium mt-1">{selectedRequest.userId.idCardNumber || "N/A"}</div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">Organization</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-gray-500" />
                      <div className="font-medium">{selectedRequest.organization}</div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">City</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div className="font-medium">{selectedRequest.city}</div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">Application Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div className="font-medium">{new Date(selectedRequest.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-500">Designation</Label>
                    <div className="font-medium mt-1">{selectedRequest.designation}</div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">Date of Joining</Label>
                    <div className="font-medium mt-1">{new Date(selectedRequest.dateOfJoining).toLocaleDateString()}</div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">License Document</Label>
                    <div className="mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleViewDocument("License Document", selectedRequest.licenseUrl)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View License Document
                      </Button>
                    </div>
                  </div>

                  {selectedRequest.remarks && (
                    <div>
                      <Label className="text-sm text-gray-500">Previous Remarks</Label>
                      <div className="p-3 bg-gray-50 rounded-md mt-1 text-sm">{selectedRequest.remarks}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes *</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Add your notes about this application..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
                {selectedRequest.status === "Pending" && (
                  <p className="text-xs text-gray-500">
                    * Required for rejection. Please provide a reason if you are rejecting this application.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            {selectedRequest && selectedRequest.status === "Pending" && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="destructive"
                  onClick={handleRejectRequest}
                  disabled={!reviewNotes}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="default"
                  onClick={handleApproveRequest}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={isDocumentPreviewOpen} onOpenChange={setIsDocumentPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewDocument?.title}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {isDocumentLoading ? (
              <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2">Loading document...</span>
              </div>
            ) : previewDocument && documentType ? (
              <div className="bg-gray-100 rounded-md p-2 h-[500px] flex items-center justify-center overflow-auto">
                {documentType === "pdf" ? (
                  <iframe
                    src={`${previewDocument.url}#toolbar=0&navpanes=0&scrollbar=1`}
                    title={previewDocument.title}
                    className="w-full h-full border-none"
                    style={{ overflow: "auto" }}
                  />
                ) : (
                  <img
                    src={previewDocument.url}
                    alt={previewDocument.title}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[500px] text-gray-500">
                Unable to load document
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-end">
            <Button onClick={() => setIsDocumentPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
//earlier 625