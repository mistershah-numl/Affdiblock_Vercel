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
import { Eye, MoreHorizontal, Search, CheckCircle, XCircle, Clock, AlertTriangle, Ban } from "lucide-react"
import { getIssuedAffidavits, revokeAffidavit } from "@/lib/api/affidavits"

export default function IssuedAffidavitsPage() {
  const router = useRouter()
  const [affidavits, setAffidavits] = useState<any[]>([])
  const [filteredAffidavits, setFilteredAffidavits] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Revoke dialog state
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
  const [selectedAffidavit, setSelectedAffidavit] = useState<any>(null)
  const [revokeReason, setRevokeReason] = useState("")

  useEffect(() => {
    fetchAffidavits()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = affidavits.filter(
        (affidavit) =>
          affidavit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          affidavit.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          affidavit.requesterName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredAffidavits(filtered)
    } else {
      setFilteredAffidavits(affidavits)
    }
  }, [searchQuery, affidavits])

  const fetchAffidavits = async () => {
    setIsLoading(true)
    try {
      const response = await getIssuedAffidavits()
      if (response.success) {
        setAffidavits(response.affidavits)
        setFilteredAffidavits(response.affidavits)
      }
    } catch (error) {
      console.error("Error fetching affidavits:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewAffidavit = (affidavitId: string) => {
    router.push(`/affidavit/${affidavitId}`)
  }

  const handleOpenRevokeDialog = (affidavit: any) => {
    setSelectedAffidavit(affidavit)
    setRevokeReason("")
    setIsRevokeDialogOpen(true)
  }

  const handleRevokeAffidavit = async () => {
    if (!selectedAffidavit || !revokeReason) return

    try {
      const response = await revokeAffidavit(selectedAffidavit._id, revokeReason)
      if (response.success) {
        // Update the affidavit in the list
        const updatedAffidavits = affidavits.map((affidavit) =>
          affidavit._id === selectedAffidavit._id ? { ...affidavit, status: "Revoked", revokeReason } : affidavit,
        )
        setAffidavits(updatedAffidavits)
        setIsRevokeDialogOpen(false)
      }
    } catch (error) {
      console.error("Error revoking affidavit:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500">Active</Badge>
      case "Pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "Rejected":
        return <Badge className="bg-red-500">Rejected</Badge>
      case "Revoked":
        return <Badge className="bg-gray-500">Revoked</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "Pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "Rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "Revoked":
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issued Affidavits</h1>
          <p className="text-gray-500">Manage affidavits you have issued</p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search affidavits..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Affidavits Table Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Your Issued Affidavits</CardTitle>
          <CardDescription>A list of all affidavits you have issued.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Date Issued</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Blockchain Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading affidavits...
                  </TableCell>
                </TableRow>
              ) : filteredAffidavits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <AlertTriangle className="h-10 w-10 mb-2" />
                      <p>No affidavits found matching your search criteria</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAffidavits.map((affidavit) => (
                  <TableRow key={affidavit._id}>
                    <TableCell className="font-medium">{affidavit.title}</TableCell>
                    <TableCell>{affidavit.category}</TableCell>
                    <TableCell>{affidavit.requesterName}</TableCell>
                    <TableCell>
                      {new Date(affidavit.dateIssued || affidavit.dateRequested).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(affidavit.status)}
                        {getStatusBadge(affidavit.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {affidavit.blockchainTxId ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-100 text-blue-800"
                        >
                          On Blockchain
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewAffidavit(affidavit._id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {affidavit.status === "Active" && (
                            <DropdownMenuItem onClick={() => handleOpenRevokeDialog(affidavit)}>
                              <Ban className="mr-2 h-4 w-4" />
                              Revoke Affidavit
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

      {/* Revoke Affidavit Dialog */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Affidavit</DialogTitle>
            <DialogDescription>
              This will permanently revoke this affidavit. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="revokeReason">Reason for Revocation *</Label>
              <Textarea
                id="revokeReason"
                placeholder="Provide a reason for revoking this affidavit..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRevokeDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevokeAffidavit} disabled={!revokeReason}>
              Revoke Affidavit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}