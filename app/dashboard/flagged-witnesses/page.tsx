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
import { AlertTriangle, MoreHorizontal, Search, User, FileText, CheckCircle, XCircle } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function FlaggedWitnessesPage() {
  const router = useRouter()
  const [witnesses, setWitnesses] = useState<any[]>([])
  const [filteredWitnesses, setFilteredWitnesses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Review dialog state
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [selectedWitness, setSelectedWitness] = useState<any>(null)
  const [reviewNotes, setReviewNotes] = useState("")

  useEffect(() => {
    fetchWitnesses()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = witnesses.filter(
        (witness) =>
          witness.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          witness.affidavitTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          witness.flaggedBy.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredWitnesses(filtered)
    } else {
      setFilteredWitnesses(witnesses)
    }
  }, [searchQuery, witnesses])

  const fetchWitnesses = async () => {
    setIsLoading(true)
    try {
      // Mock data - in a real app, this would be fetched from an API
      const mockWitnesses = [
        {
          id: "witness_1",
          name: "Alice Johnson",
          userId: "user_123",
          affidavitId: "aff_123",
          affidavitTitle: "Property Transfer Deed",
          flaggedBy: "John Doe (Issuer)",
          flaggedDate: "2025-03-10",
          reason: "Witness was not present during the signing",
          status: "Pending Review",
          evidence: "Video recording of the signing session",
        },
        {
          id: "witness_2",
          name: "Bob Smith",
          userId: "user_456",
          affidavitId: "aff_456",
          affidavitTitle: "Business Partnership Agreement",
          flaggedBy: "Jane Smith (Issuer)",
          flaggedDate: "2025-03-08",
          reason: "Witness provided false identification",
          status: "Confirmed Fake",
          evidence: "ID verification failure report",
        },
        {
          id: "witness_3",
          name: "Charlie Brown",
          userId: "user_789",
          affidavitId: "aff_789",
          affidavitTitle: "Vehicle Ownership Transfer",
          flaggedBy: "Robert Johnson (Issuer)",
          flaggedDate: "2025-03-05",
          reason: "Witness signature does not match previous documents",
          status: "Cleared",
          evidence: "Signature analysis report",
        },
        {
          id: "witness_4",
          name: "Diana Prince",
          userId: "user_101",
          affidavitId: "aff_101",
          affidavitTitle: "Rental Agreement",
          flaggedBy: "Michael Brown (Admin)",
          flaggedDate: "2025-03-01",
          reason: "Witness claimed to be at multiple locations simultaneously",
          status: "Pending Review",
          evidence: "Timestamp analysis of multiple affidavits",
        },
      ]

      setWitnesses(mockWitnesses)
      setFilteredWitnesses(mockWitnesses)
    } catch (error) {
      console.error("Error fetching witnesses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewWitness = (witnessId: string) => {
    router.push(`/dashboard/users/${witnessId}`)
  }

  const handleViewAffidavit = (affidavitId: string) => {
    router.push(`/affidavit/${affidavitId}`)
  }

  const handleOpenReviewDialog = (witness: any) => {
    setSelectedWitness(witness)
    setReviewNotes("")
    setIsReviewDialogOpen(true)
  }

  const handleReviewWitness = async (decision: "confirm" | "clear") => {
    if (!selectedWitness) return

    try {
      // In a real app, this would call an API
      const newStatus = decision === "confirm" ? "Confirmed Fake" : "Cleared"

      // Update the witness in the list
      const updatedWitnesses = witnesses.map((witness) =>
        witness.id === selectedWitness.id ? { ...witness, status: newStatus, reviewNotes } : witness,
      )

      setWitnesses(updatedWitnesses)
      setIsReviewDialogOpen(false)
    } catch (error) {
      console.error("Error reviewing witness:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending Review":
        return <Badge className="bg-yellow-500">Pending Review</Badge>
      case "Confirmed Fake":
        return <Badge className="bg-red-500">Confirmed Fake</Badge>
      case "Cleared":
        return <Badge className="bg-green-500">Cleared</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Flagged Witnesses</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Review and manage witnesses that have been flagged as potentially fraudulent
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search witnesses..."
              className="pl-8 w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Flagged Witnesses</CardTitle>
            <CardDescription>Witnesses that have been flagged for suspicious activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Witness</TableHead>
                  <TableHead>Affidavit</TableHead>
                  <TableHead>Flagged By</TableHead>
                  <TableHead>Flagged Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading witnesses...
                    </TableCell>
                  </TableRow>
                ) : filteredWitnesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No flagged witnesses found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWitnesses.map((witness) => (
                    <TableRow key={witness.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{witness.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{witness.affidavitTitle}</TableCell>
                      <TableCell>{witness.flaggedBy}</TableCell>
                      <TableCell>{witness.flaggedDate}</TableCell>
                      <TableCell className="max-w-xs truncate" title={witness.reason}>
                        {witness.reason}
                      </TableCell>
                      <TableCell>{getStatusBadge(witness.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewWitness(witness.userId)}>
                              <User className="mr-2 h-4 w-4" />
                              View Witness
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewAffidavit(witness.affidavitId)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Affidavit
                            </DropdownMenuItem>
                            {witness.status === "Pending Review" && (
                              <DropdownMenuItem onClick={() => handleOpenReviewDialog(witness)}>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Review Flag
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Flagged Witness</DialogTitle>
            <DialogDescription>Review the evidence and make a decision about this flagged witness.</DialogDescription>
          </DialogHeader>

          {selectedWitness && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Witness</Label>
                <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">{selectedWitness.name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Affidavit</Label>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">{selectedWitness.affidavitTitle}</div>
              </div>

              <div className="space-y-2">
                <Label>Flagged By</Label>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">{selectedWitness.flaggedBy}</div>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">{selectedWitness.reason}</div>
              </div>

              <div className="space-y-2">
                <Label>Evidence</Label>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">{selectedWitness.evidence}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Add your notes about this review..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => handleReviewWitness("confirm")}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Confirm as Fake
              </Button>
              <Button
                variant="default"
                onClick={() => handleReviewWitness("clear")}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Clear Witness
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
