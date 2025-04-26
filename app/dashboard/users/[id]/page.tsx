"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  User,
  Mail,
  Calendar,
  Shield,
  Ban,
  Edit,
  ArrowLeft,
  Eye,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { getUserById, banUser, updateUser } from "@/lib/api/users"
import { getUserAffidavits } from "@/lib/api/affidavits"

export default function UserDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [affidavits, setAffidavits] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [banDuration, setBanDuration] = useState("Permanent")

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editUserData, setEditUserData] = useState<any>({})

  useEffect(() => {
    if (userId) {
      fetchUserData()
    }
  }, [userId])

  const fetchUserData = async () => {
    setIsLoading(true)
    try {
      const userResponse = await getUserById(userId)
      if (userResponse.success) {
        setUser(userResponse.user)
        setEditUserData({
          _id: userResponse.user._id,
          name: userResponse.user.name,
          email: userResponse.user.email,
          role: userResponse.user.role,
          status: userResponse.user.status,
        })

        const affidavitsResponse = await getUserAffidavits(userId)
        if (affidavitsResponse.success) {
          setAffidavits(affidavitsResponse.affidavits)
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenBanDialog = () => {
    setBanReason("")
    setBanDuration("Permanent")
    setIsBanDialogOpen(true)
  }

  const handleBanUser = async () => {
    if (!user || !banReason) return

    try {
      const response = await banUser(user._id, banReason, banDuration)
      if (response.success) {
        setUser({ ...user, status: "Banned", banReason, banDuration })
        setIsBanDialogOpen(false)
      }
    } catch (error) {
      console.error("Error banning user:", error)
    }
  }

  const handleOpenEditDialog = () => {
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!editUserData._id) return

    try {
      const response = await updateUser(editUserData._id, editUserData)
      if (response.success) {
        setUser({ ...user, ...editUserData })
        setIsEditDialogOpen(false)
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleViewAffidavit = (affidavitId: string) => {
    router.push(`/affidavit/${affidavitId}`)
  }

  const getUserStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500">Active</Badge>
      case "Inactive":
        return <Badge variant="outline">Inactive</Badge>
      case "Banned":
        return <Badge className="bg-red-500">Banned</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getAffidavitStatusBadge = (status: string) => {
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <p>Loading user data...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <h1 className="text-3xl font-bold mb-2">User Not Found</h1>
          <p className="text-gray-500 mb-4">
            The user you are looking for does not exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/dashboard/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleOpenEditDialog}>
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </Button>

          {user.status !== "Banned" && (
            <Button variant="destructive" onClick={handleOpenBanDialog}>
              <Ban className="mr-2 h-4 w-4" />
              Ban User
            </Button>
          )}
        </div>
      </div>

      {/* User Information Section */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>User details and account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                <User className="h-12 w-12 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {user.role === "Issuer" ? (
                  <Badge className="bg-blue-500">Issuer</Badge>
                ) : user.role === "Admin" ? (
                  <Badge className="bg-purple-500">Admin</Badge>
                ) : (
                  <Badge variant="outline">User</Badge>
                )}
                {getUserStatusBadge(user.status)}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">ID Card Number</p>
                  <p>{user.idCardNumber}</p>
                </div>
              </div>

              {user.walletAddress && (
                <div className="flex items-start gap-2">
                  <Wallet className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Wallet Address</p>
                    <p className="text-sm break-all">{user.walletAddress}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {user.status === "Banned" && (
                <div className="flex items-start gap-2">
                  <Ban className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Ban Information</p>
                    <p className="text-sm">{user.banReason}</p>
                    <p className="text-xs text-gray-500 mt-1">Duration: {user.banDuration}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ID Card Images */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Identification Documents</CardTitle>
            <CardDescription>ID card and verification documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">ID Card (Front)</p>
                <div className="border rounded-md overflow-hidden">
                  <img
                    src={user.idCardFrontUrl || "/placeholder.svg?height=200&width=320&text=ID+Card+Front"}
                    alt="ID Card Front"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">ID Card (Back)</p>
                <div className="border rounded-md overflow-hidden">
                  <img
                    src={user.idCardBackUrl || "/placeholder.svg?height=200&width=320&text=ID+Card+Back"}
                    alt="ID Card Back"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>

            {user.role === "Issuer" && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">License Document</p>
                <div className="border rounded-md overflow-hidden">
                  <img
                    src={user.licenseDocumentUrl || "/placeholder.svg?height=200&width=640&text=License+Document"}
                    alt="License Document"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Affidavits Section */}
      <Card>
        <CardHeader>
          <CardTitle>User Affidavits</CardTitle>
          <CardDescription>All affidavits associated with this user</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <AffidavitsTable affidavits={affidavits} onViewAffidavit={handleViewAffidavit} />
            </TabsContent>

            <TabsContent value="active">
              <AffidavitsTable
                affidavits={affidavits.filter((a) => a.status === "Active")}
                onViewAffidavit={handleViewAffidavit}
              />
            </TabsContent>

            <TabsContent value="pending">
              <AffidavitsTable
                affidavits={affidavits.filter((a) => a.status === "Pending")}
                onViewAffidavit={handleViewAffidavit}
              />
            </TabsContent>

            <TabsContent value="rejected">
              <AffidavitsTable
                affidavits={affidavits.filter((a) => a.status === "Rejected" || a.status === "Revoked")}
                onViewAffidavit={handleViewAffidavit}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ban User Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              This will prevent the user from accessing the system. They will be notified via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="banReason">Reason for Ban *</Label>
              <Textarea
                id="banReason"
                placeholder="Provide a reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banDuration">Ban Duration</Label>
              <Select value={banDuration} onValueChange={setBanDuration}>
                <SelectTrigger id="banDuration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="90days">90 Days</SelectItem>
                  <SelectItem value="Permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setIsBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBanUser} disabled={!banReason}>
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and status.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editUserData.name || ""}
                onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editUserData.email || ""}
                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select
                value={editUserData.role || ""}
                onValueChange={(value) => setEditUserData({ ...editUserData, role: value })}
              >
                <SelectTrigger id="editRole">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Issuer">Issuer</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={editUserData.status || ""}
                onValueChange={(value) => setEditUserData({ ...editUserData, status: value })}
              >
                <SelectTrigger id="editStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper component for affidavits table
function AffidavitsTable({
  affidavits,
  onViewAffidavit,
}: { affidavits: any[]; onViewAffidavit: (id: string) => void }) {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Issuer</TableHead>
          <TableHead>Date Requested</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {affidavits.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              No affidavits found.
            </TableCell>
          </TableRow>
        ) : (
          affidavits.map((affidavit) => (
            <TableRow key={affidavit._id}>
              <TableCell className="font-medium">{affidavit.title}</TableCell>
              <TableCell>{affidavit.category}</TableCell>
              <TableCell>{affidavit.issuerName}</TableCell>
              <TableCell>{new Date(affidavit.dateRequested).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(affidavit.status)}
                  {getStatusBadge(affidavit.status)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onViewAffidavit(affidavit._id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}