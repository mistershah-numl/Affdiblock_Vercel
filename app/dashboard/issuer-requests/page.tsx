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
} from "lucide-react"
import { getIssuerRequests, approveIssuerRequest, rejectIssuerRequest } from "@/lib/api/users"
import DashboardLayout from "@/components/dashboard-layout"

export default function IssuerRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<any[]>([])
  const [filteredRequests, setFilteredRequests] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Review dialog state
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [reviewNotes, setReviewNotes] = useState("")

  // Document preview dialog
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<{ title: string; url: string } | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = requests.filter(
        (request) =>
          request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredRequests(filtered)
    } else {
      setFilteredRequests(requests)
    }
  }, [searchQuery, requests])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const response = await getIssuerRequests()
      if (response.success) {
        setRequests(response.requests)
        setFilteredRequests(response.requests)
      }
    } catch (error) {
      console.error("Error fetching issuer requests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewUser = (userId: string) => {
    router.push(`/dashboard/users/${userId}`)
  }

  const handleOpenReviewDialog = (request: any) => {
    setSelectedRequest(request)
    setReviewNotes("")
    setIsReviewDialogOpen(true)
  }

  const handleApproveRequest = async () => {
    if (!selectedRequest) return

    try {
      const response = await approveIssuerRequest(selectedRequest._id, "admin_123456789")
      if (response.success) {
        // Update the request in the list
        const updatedRequests = requests.map((request) =>
          request._id === selectedRequest._id ? { ...request, status: "Approved", reviewNotes } : request,
        )
        setRequests(updatedRequests)
        setIsReviewDialogOpen(false)
      }
    } catch (error) {
      console.error("Error approving request:", error)
    }
  }

  const handleRejectRequest = async () => {
    if (!selectedRequest || !reviewNotes) return

    try {
      const response = await rejectIssuerRequest(selectedRequest._id, "admin_123456789", reviewNotes)
      if (response.success) {
        // Update the request in the list
        const updatedRequests = requests.map((request) =>
          request._id === selectedRequest._id ? { ...request, status: "Rejected", reviewNotes } : request,
        )
        setRequests(updatedRequests)
        setIsReviewDialogOpen(false)
      }
    } catch (error) {
      console.error("Error rejecting request:", error)
    }
  }

  const handleViewDocument = (title: string, url: string) => {
    setPreviewDocument({ title, url })
    setIsDocumentPreviewOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "Approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "Rejected":
        return <Badge className="bg-red-500">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Issuer Requests</h2>
            <p className="text-gray-500 dark:text-gray-400">Review and manage requests to become an issuer</p>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search requests..."
              className="pl-8 w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Issuer Applications</CardTitle>
            <CardDescription>Applications from users who want to become issuers</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>License Number</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Application Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading requests...
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No issuer requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{request.name}</div>
                            <div className="text-xs text-gray-500">{request.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{request.licenseNumber}</TableCell>
                      <TableCell>{request.organization}</TableCell>
                      <TableCell>{request.city}</TableCell>
                      <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(request.userId)}>
                              <User className="mr-2 h-4 w-4" />
                              View Applicant
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewDocument("License Document", request.licenseDocumentUrl)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View License
                            </DropdownMenuItem>
                            {request.certificatesUrl && (
                              <DropdownMenuItem
                                onClick={() => handleViewDocument("Certificates", request.certificatesUrl)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                View Certificates
                              </DropdownMenuItem>
                            )}
                            {request.status === "Pending" && (
                              <DropdownMenuItem onClick={() => handleOpenReviewDialog(request)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Review Application
                              </DropdownMenuItem>
                            )}
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
      </div>

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
                        <div className="font-medium">{selectedRequest.name}</div>
                        <div className="text-sm text-gray-500">{selectedRequest.email}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">License Number</Label>
                    <div className="font-medium mt-1">{selectedRequest.licenseNumber}</div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">Organization</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-gray-500" />
                      <div className="font-medium">{selectedRequest.organization}</div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">Location</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div className="font-medium">
                        {selectedRequest.city}, {selectedRequest.address}
                      </div>
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
                    <Label className="text-sm text-gray-500">Experience</Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md mt-1 text-sm">
                      {selectedRequest.experience}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">Documents</Label>
                    <div className="space-y-2 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleViewDocument("License Document", selectedRequest.licenseDocumentUrl)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View License Document
                      </Button>

                      {selectedRequest.certificatesUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleViewDocument("Certificates", selectedRequest.certificatesUrl)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Certificates
                        </Button>
                      )}

                      {selectedRequest.otherDocumentsUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleViewDocument("Other Documents", selectedRequest.otherDocumentsUrl)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Other Documents
                        </Button>
                      )}
                    </div>
                  </div>
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

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            {selectedRequest && selectedRequest.status === "Pending" && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleRejectRequest}
                  disabled={!reviewNotes}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button variant="default" onClick={handleApproveRequest} className="flex items-center gap-2">
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
            {previewDocument && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2 h-[500px] flex items-center justify-center">
                <img
                  src={previewDocument.url || "/placeholder.svg?height=500&width=700&text=Document+Preview"}
                  alt={previewDocument.title}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsDocumentPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
