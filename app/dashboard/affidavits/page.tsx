"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Filter, Edit, Trash2, Eye, AlertCircle, FilePlus } from "lucide-react"
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
import CreateAffidavitDialog from "@/components/create-affidavit-dialog"

export default function AffidavitsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAffidavitId, setSelectedAffidavitId] = useState<string | null>(null)

  // Mock user role - in a real app, this would come from authentication
  const userRole = "Admin" // Could be "Admin", "Issuer", or "User"

  // Mock affidavits data
  const affidavits = [
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
      userId: "user1", // Current user's ID
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
      userId: "user1", // Current user's ID
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
      userId: "user1", // Current user's ID
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500">Active</Badge>
      case "Pending":
        return (
          <Badge variant="outline" className="text-orange-500 border-orange-500">
            Pending
          </Badge>
        )
      case "Rejected":
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
    if (userRole === "User" && affidavit.userId !== "user1") {
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

  const handleDeleteClick = (id: string) => {
    setSelectedAffidavitId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    // In a real app, this would call an API to delete the affidavit
    console.log(`Deleting affidavit ${selectedAffidavitId}`)
    setIsDeleteDialogOpen(false)
    setSelectedAffidavitId(null)
    // Refresh the list or show a success message
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affidavits</h1>
          <p className="text-gray-500">Manage and view all affidavits</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <FilePlus className="h-4 w-4" />
          <span>Request New Affidavit</span>
        </Button>
      </div>

      {/* Affidavits Table Section */}
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

                        {/* Edit button - visible to Admins and Issuers */}
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

                        {/* Delete button - visible only to Admins */}
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
    </div>
  )
}