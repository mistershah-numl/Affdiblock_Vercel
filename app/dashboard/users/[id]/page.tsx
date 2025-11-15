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
import { Checkbox } from "@/components/ui/checkbox"
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
  Building,
  MapPin,
  Briefcase,
  Users,
  UserCheck,
  FileText,
  Loader2,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"

// Helper function for avatar URL (direct IPFS or placeholder)
const getAvatarUrl = (path: string | null | undefined) => {
  if (!path || !path.startsWith("https://gateway.pinata.cloud/ipfs/")) {
    return "/placeholder.svg?height=128&width=128";
  }
  return path;
};

export default function UserDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { user: authUser, isLoading: authLoading, isAuthenticated, token } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [affidavitsCounts, setAffidavitsCounts] = useState({ total: 0, accepted: 0, rejected: 0, witnessed: 0 })
  const [affidavits, setAffidavits] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [banDuration, setBanDuration] = useState("Permanent")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editUserData, setEditUserData] = useState<any>({})

  // Document preview state
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<{ title: string; url: string } | null>(null)
  const [isDocumentLoading, setIsDocumentLoading] = useState(false)
  const [documentType, setDocumentType] = useState<"image" | "pdf" | null>(null)

  const handleViewDocument = async (title: string, url: string) => {
    setIsDocumentLoading(true)
    setPreviewDocument({ title, url })
    setIsDocumentPreviewOpen(true)

    // Determine file type
    try {
      const response = await fetch(url, { method: "HEAD" })
      const contentType = response.headers.get("content-type")
      setDocumentType(contentType?.includes("pdf") ? "pdf" : "image")
    } catch (error) {
      // Fallback to extension-based check
      setDocumentType(url.toLowerCase().endsWith(".pdf") ? "pdf" : "image")
    } finally {
      setIsDocumentLoading(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isClient, authLoading, isAuthenticated, router])

  useEffect(() => {
    if (userId && token && isAuthenticated && (authUser?.activeRole === "Admin" || authUser?.activeRole === "Issuer")) {
      fetchUserData()
    }
  }, [userId, token, isAuthenticated, authUser])

  const fetchUserData = async () => {
    setIsLoading(true)
    try {
      const userResponse = await fetch(`/api/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const userData = await userResponse.json()
      if (userData.success) {
        setUser(userData.user)
        setAffidavitsCounts(userData.affidavitsCounts || { total: 0, accepted: 0, rejected: 0, witnessed: 0 })
        setEditUserData({
          _id: userData.user._id,
          name: userData.user.name,
          email: userData.user.email,
          roles: userData.user.roles || [],
          activeRole: userData.user.activeRole,
          status: userData.user.status,
          remarks: userData.user.remarks || "",
        })
      } else {
        toast({
          title: "Error",
          description: userData.error || "Failed to fetch user data",
          variant: "destructive",
        })
      }
      const affidavitsResponse = await fetch(`/api/user/${userId}/affidavits`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const affData = await affidavitsResponse.json()
      if (affData.success) {
        setAffidavits(affData.affidavits)
      } else {
        toast({
          title: "Error",
          description: affData.error || "Failed to fetch affidavits",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching user data",
        variant: "destructive",
      })
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
      const remarks = `Reason: ${banReason} Duration: ${banDuration}`
      const updateData = {
        status: "Banned",
        remarks
      }
      const response = await fetch(`/api/user/admin-update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user._id, ...updateData })
      })
      const data = await response.json()
      if (data.success) {
        setUser({ ...user, status: "Banned", remarks })
        setIsBanDialogOpen(false)
        toast({ title: "Success", description: "User banned successfully", variant: "default" })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to ban user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error banning user:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while banning user",
        variant: "destructive",
      })
    }
  }

  const handleOpenEditDialog = () => {
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!editUserData._id) return
    try {
      const rolesToSend = [...new Set(["User", ...editUserData.roles.filter((r: string) => r !== "User")])];
      const updateData = { ...editUserData, roles: rolesToSend }
      const response = await fetch(`/api/user/admin-update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: editUserData._id, ...updateData })
      })
      const data = await response.json()
      if (data.success) {
        setUser({ ...user, ...data.user })
        setIsEditDialogOpen(false)
        toast({ title: "Success", description: "User updated successfully", variant: "default" })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating user",
        variant: "destructive",
      })
    }
  }

  const handleViewAffidavit = (displayId: string) => {
    router.push(`/affidavit/${displayId}`)
  }

  const handleRoleCheckboxChange = (role: string, checked: boolean) => {
    setEditUserData((prev: any) => {
      if (role === "User" && !checked) {
        return prev;
      }
      const newRoles = checked
        ? [...(prev.roles || []), role]
        : (prev.roles || []).filter((r: string) => r !== role);
      return { ...prev, roles: newRoles };
    });
  };

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

  const getRoleBadges = (roles: string[]) => {
    return roles.map((role) => {
      if (role === "Issuer") {
        return <Badge key={role} className="bg-blue-500 ml-1">Issuer</Badge>
      } else if (role === "Admin") {
        return <Badge key={role} className="bg-purple-500 ml-1">Admin</Badge>
      } else {
        return <Badge key={role} variant="outline" className="ml-1">User</Badge>
      }
    });
  }

  const getAffidavitStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
      case "Accepted":
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

  if (!isClient || authLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !authUser || (authUser.activeRole !== "Admin" && authUser.activeRole !== "Issuer")) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-4">You do not have permission to view this page.</p>
          <Button onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
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

  const isIssuer = user.roles?.includes("Issuer")
  const isAdmin = authUser.activeRole === "Admin"

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/users")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          </div>
          {isAdmin && (
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
          )}
        </div>

        {/* Affidavit Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">All Affidavits</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{affidavitsCounts.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{affidavitsCounts.accepted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{affidavitsCounts.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Witnessed</CardTitle>
              <UserCheck className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{affidavitsCounts.witnessed}</div>
            </CardContent>
          </Card>
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
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4 overflow-hidden">
                  <Image
                    src={getAvatarUrl(user.avatar)}
                    alt={user.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                  {getRoleBadges(user.roles || [])}
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
                {isIssuer && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <Building className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Organization</p>
                          <p>{user.organization}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">City</p>
                          <p>{user.city}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Designation</p>
                          <p>{user.designation}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Date of Joining</p>
                          <p>{new Date(user.dateOfJoining).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {user.status === "Banned" && (
                  <div className="flex items-start gap-2">
                    <Ban className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Ban Information</p>
                      <p className="text-sm">{user.remarks}</p>
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
                  <div className="border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center" style={{ height: '240px' }}>
                    <img
                      src={user.idCardFrontUrl || "/placeholder.svg?height=240&width=380&text=ID+Card+Front"}
                      alt="ID Card Front"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">ID Card (Back)</p>
                  <div className="border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center" style={{ height: '240px' }}>
                    <img
                      src={user.idCardBackUrl || "/placeholder.svg?height=240&width=380&text=ID+Card+Back"}
                      alt="ID Card Back"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
              {isIssuer && user.licenseUrl && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-2">License Document</p>
                  <div className="border rounded-md overflow-hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleViewDocument("License Document", user.licenseUrl)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View License Document
                    </Button>
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
                <TabsTrigger value="witnessed">Witnessed</TabsTrigger>  {/* New tab for witnessed affidavits */}
              </TabsList>
              <TabsContent value="all">
                <AffidavitsTable affidavits={affidavits} onViewAffidavit={handleViewAffidavit} />
              </TabsContent>
              <TabsContent value="active">
                <AffidavitsTable
                  affidavits={affidavits.filter((a) => a.status === "Active" || a.status === "Accepted")}
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
              <TabsContent value="witnessed">  {/* New content for witnessed affidavits */}
                <AffidavitsTable
                  affidavits={affidavits.filter((a) => a.witnesses.some((w: any) => w.contactId === userId))}
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
                <Label>Roles</Label>
                <div className="flex flex-col space-y-2">
                  {["User", "Issuer", "Admin"].map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={editUserData.roles?.includes(role)}
                        onCheckedChange={(checked) => handleRoleCheckboxChange(role, checked as boolean)}
                        disabled={role === "User"}
                      />
                      <label
                        htmlFor={`role-${role}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {role}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editActiveRole">Active Role</Label>
                <Select
                  value={editUserData.activeRole || ""}
                  onValueChange={(value) => setEditUserData({ ...editUserData, activeRole: value })}
                >
                  <SelectTrigger id="editActiveRole">
                    <SelectValue placeholder="Select active role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editUserData.roles || []).map((role: string) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
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
                    {/* <SelectItem value="Inactive">Inactive</SelectItem> */}
                    <SelectItem value="Banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editUserData.status === "Banned" && (
                <div className="space-y-2">
                  <Label htmlFor="editRemarks">Remarks</Label>
                  <Textarea
                    id="editRemarks"
                    value={editUserData.remarks || ""}
                    onChange={(e) => setEditUserData({ ...editUserData, remarks: e.target.value })}
                    placeholder="Provide remarks for banned user..."
                    rows={3}
                  />
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Document Preview Dialog */}
        <Dialog open={isDocumentPreviewOpen} onOpenChange={setIsDocumentPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{previewDocument?.title}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-auto">
              {isDocumentLoading ? (
                <div className="flex items-center justify-center h-[600px]">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  <span className="ml-2">Loading document...</span>
                </div>
              ) : previewDocument && documentType ? (
                <div className="bg-gray-100 rounded-md p-4 flex items-center justify-center" style={{ minHeight: '600px' }}>
                  {documentType === "pdf" ? (
                    <object
                      data={previewDocument.url}
                      type="application/pdf"
                      width="100%"
                      height="600"
                      className="w-full border-none rounded"
                    >
                      <p>Unable to display PDF. <a href={previewDocument.url} target="_blank" rel="noopener noreferrer">Download instead</a></p>
                    </object>
                  ) : (
                    <div className="w-full flex items-center justify-center" style={{ height: '600px' }}>
                      <img
                        src={previewDocument.url}
                        alt={previewDocument.title}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[600px] text-gray-500">
                  Unable to load document
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-end mt-4">
              <Button onClick={() => setIsDocumentPreviewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}

// Helper component for affidavits table
function AffidavitsTable({
  affidavits,
  onViewAffidavit,
}: { affidavits: any[]; onViewAffidavit: (displayId: string) => void }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
      case "Accepted":
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
      case "Accepted":
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
          <TableHead>Display ID</TableHead>
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
            <TableCell colSpan={7} className="text-center py-8">
              No affidavits found.
            </TableCell>
          </TableRow>
        ) : (
          affidavits.map((affidavit) => (
            <TableRow key={affidavit._id}>
              <TableCell className="font-medium">{affidavit.displayId}</TableCell>
              <TableCell>{affidavit.title}</TableCell>
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
                <Button variant="ghost" size="sm" onClick={() => onViewAffidavit(affidavit.displayId)}>
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
//earlier 888 , working for both admin and issuer , for issuer , no button are showing , also showing witnessed
//now it shows profile photo as well and workign well for both issuer and admin , not for others , shows access denied