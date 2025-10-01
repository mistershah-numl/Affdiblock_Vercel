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
import { Eye, MoreHorizontal, Search, AlertTriangle, Ban } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { toast } from "@/components/ui/use-toast"

export default function IssuedAffidavitsPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth()
  const [affidavits, setAffidavits] = useState<any[]>([])
  const [filteredAffidavits, setFilteredAffidavits] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Revoke dialog state
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
  const [selectedAffidavit, setSelectedAffidavit] = useState<any>(null)
  const [revokeReason, setRevokeReason] = useState("")
  const [basisDisplayId, setBasisDisplayId] = useState("")
  const [revokeError, setRevokeError] = useState("")

  useEffect(() => {
    if (!isAuthenticated || !user || user.activeRole !== "Issuer") {
      router.push("/dashboard")
      return
    }
    fetchAffidavits()
  }, [isAuthenticated, user, token, router])

  useEffect(() => {
    if (searchQuery) {
      const filtered = affidavits.filter(
        (affidavit) =>
          affidavit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          affidavit.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (affidavit.requesterName || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredAffidavits(filtered)
    } else {
      setFilteredAffidavits(affidavits)
    }
  }, [searchQuery, affidavits])

  const fetchAffidavits = async () => {
    if (!token || !user?._id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/affidavits?type=issued`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setAffidavits(data.affidavits)
        setFilteredAffidavits(data.affidavits)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch issued affidavits",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching affidavits:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching affidavits",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewAffidavit = (displayId: string) => {
    router.push(`/affidavit/${displayId}`)
  }

  const handleOpenRevokeDialog = (affidavit: any) => {
    if (affidavit.status === "Revoked") {
      toast({
        title: "Cannot Revoke",
        description: "Already revoked affidavits cannot be revoked again",
        variant: "destructive",
      })
      return
    }
    setSelectedAffidavit(affidavit)
    setRevokeReason("")
    setBasisDisplayId("")
    setRevokeError("")
    setIsRevokeDialogOpen(true)
  }

  const handleRevokeAffidavit = async () => {
    setRevokeError("")
    const trimmedBasisId = basisDisplayId.trim()

    if (!selectedAffidavit || !trimmedBasisId) {
      setRevokeError("Basis Display ID is required")
      return
    }

    if (trimmedBasisId === selectedAffidavit.displayId) {
      setRevokeError("Basis Display ID cannot be the same as the current affidavit ID")
      return
    }

    try {
      const response = await fetch("/api/affidavits/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          currentAffidavitId: selectedAffidavit._id, 
          basisDisplayId: trimmedBasisId,
          reason: revokeReason || undefined 
        }),
      })
      const data = await response.json()
      if (data.success) {
        // Update local state
        const updatedAffidavits = affidavits.map((affidavit) =>
          affidavit._id === selectedAffidavit._id 
            ? { ...affidavit, status: "Revoked", revokeReason: data.affidavit.revokeReason, basisDisplayId: data.affidavit.basisDisplayId } 
            : affidavit,
        )
        setAffidavits(updatedAffidavits)
        setFilteredAffidavits(updatedAffidavits)
        toast({ title: "Success", description: "Affidavit revoked successfully", variant: "default" })
        setIsRevokeDialogOpen(false)
        setRevokeReason("")
        setBasisDisplayId("")
      } else {
        setRevokeError(data.error || "Failed to revoke affidavit")
      }
    } catch (error) {
      console.error("Error revoking affidavit:", error)
      setRevokeError("An unexpected error occurred")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
      case "Accepted":
        return <Badge className="bg-green-500">Active</Badge>
      case "Rejected":
        return <Badge className="bg-red-500">Rejected</Badge>
      case "Revoked":
        return <Badge className="bg-gray-500">Revoked</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getBlockchainStatusBadge = (affidavit: any) => {
    if (affidavit.transactionHash) {
      if (affidavit.isVerifiedOnBlockchain === true) {
        return <Badge className="bg-green-100 text-green-800">Authentic</Badge>
      } else if (affidavit.isVerifiedOnBlockchain === false) {
        return <Badge className="bg-red-100 text-red-800">Tampered</Badge>
      } else {
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Verification</Badge>
      }
    } else {
      return <Badge variant="secondary">Not on Blockchain</Badge>
    }
  }

  if (authLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 p-6">
        {/* Header Section - Responsive */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Issued Affidavits</h1>
            <p className="text-sm md:text-base text-gray-500">Manage affidavits you have issued</p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search affidavits..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Affidavits Table Section - Responsive */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg md:text-xl">Your Issued Affidavits</CardTitle>
            <CardDescription className="text-sm">A list of all affidavits you have issued.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">ID</TableHead>
                    <TableHead className="whitespace-nowrap">Title</TableHead>
                    <TableHead className="whitespace-nowrap">Category</TableHead>
                    <TableHead className="whitespace-nowrap">Requester</TableHead>
                    <TableHead className="whitespace-nowrap">Date Issued</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Blockchain Status</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading affidavits...
                      </TableCell>
                    </TableRow>
                  ) : filteredAffidavits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <AlertTriangle className="h-10 w-10 mb-2" />
                          <p className="text-sm">No affidavits found matching your search criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAffidavits.map((affidavit) => (
                      <TableRow key={affidavit._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm">{affidavit.displayId}</TableCell>
                        <TableCell className="text-sm">{affidavit.title}</TableCell>
                        <TableCell className="text-sm">{affidavit.category}</TableCell>
                        <TableCell className="text-sm">{affidavit.requesterName}</TableCell>
                        <TableCell className="text-sm">{new Date(affidavit.dateIssued || affidavit.dateRequested).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(affidavit.status)}</TableCell>
                        <TableCell>{getBlockchainStatusBadge(affidavit)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col sm:flex-row justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewAffidavit(affidavit.displayId)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {affidavit.status !== "Revoked" && (
                                  <DropdownMenuItem onClick={() => handleOpenRevokeDialog(affidavit)} className="text-red-600">
                                    <Ban className="mr-2 h-4 w-4" />
                                    Revoke Affidavit
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Revoke Affidavit Dialog - Responsive */}
        <Dialog open={isRevokeDialogOpen} onOpenChange={(open) => {
          setIsRevokeDialogOpen(open)
          if (!open) {
            setRevokeError("")
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Revoke Affidavit</DialogTitle>
              <DialogDescription>
                This will permanently revoke this affidavit. This action cannot be undone. Provide the basis affidavit ID (must be active).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentId">Current Affidavit Display ID (Read-only)</Label>
                <Input
                  id="currentId"
                  value={selectedAffidavit?.displayId || ""}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basisId">Basis Affidavit Display ID *</Label>
                <Input
                  id="basisId"
                  placeholder="Enter display ID of active affidavit (e.g., AFF-2025-00001)"
                  value={basisDisplayId}
                  onChange={(e) => setBasisDisplayId(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revokeReason">Reason for Revocation (Optional)</Label>
                <Textarea
                  id="revokeReason"
                  placeholder="Provide a reason for revoking this affidavit (optional)..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  rows={3}
                  className="w-full"
                />
              </div>
              {revokeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{revokeError}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsRevokeDialogOpen(false)
                setRevokeError("")
              }}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRevokeAffidavit}
                disabled={!selectedAffidavit || !basisDisplayId.trim()}
              >
                Revoke Affidavit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}


//earlier 274 lines of code and was static