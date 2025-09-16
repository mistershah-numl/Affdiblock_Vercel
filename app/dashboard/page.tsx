"use client"

// Ensure this export comes after "use client"
export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamicImport from "next/dynamic"
import { Users, FileText, Clock, Search, Filter, FilePlus, CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { toast } from "@/components/ui/use-toast"

// Dynamically import CreateAffidavitDialog for client-side rendering
const CreateAffidavitDialog = dynamicImport(() => import("@/components/create-affidavit-dialog"), {
  ssr: false,
  loading: () => <div>Loading affidavit dialog...</div>,
})

// Define interfaces for TypeScript
interface Affidavit {
  _id: string
  displayId: string
  title: string
  category: string
  issuerId: { _id: string; name: string; area: string; idCardNumber: string } | string
  issuerName: string
  dateIssued: string
  status: string
}

interface User {
  _id: string
  name: string
  email: string
  roles: string[]
  activeRole: string
  createdAt: string
  status: string
  idCardNumber?: string
  formattedIdCardNumber?: string
}

interface IssuerRequest {
  _id: string
  userId: { _id: string; name: string; email: string; idCardNumber: string }
  organization: string
  city: string
  designation: string
  dateOfJoining: string
  status: string
  remarks?: string
  createdAt: string
}

interface AffidavitRequest {
  _id: string
  displayId: string
  title: string
  category: string
  issuerId: { _id: string; name: string; area: string; idCardNumber: string }
  createdAt: string
  status: string
  sellerId?: { name: string }
  buyerId?: { name: string }
  witnesses: { contactId: { name: string } }[]
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, token } = useAuth()
  const [isClient, setIsClient] = useState(false)

  // Ensure the component only renders on the client side after mounting
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle redirect on the client side only
  useEffect(() => {
    if (isClient && !isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isClient, isLoading, isAuthenticated, router])

  // Render a consistent structure on both server and client
  if (!isClient) {
    return <div className="flex flex-col gap-6 p-6"></div>
  }

  // On the client, show the loading state or the dashboard
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <div className="flex flex-col gap-6 p-6"></div>
  }

  // Check if user.activeRole exists in user.roles
  const hasAccess = user.roles.includes(user.activeRole)

  if (!hasAccess) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="text-red-500">
          Access Denied: Your active role "{user.activeRole}" is not in your assigned roles.
        </div>
      </div>
    )
  }

  // Render different dashboards based on the user's active role
  switch (user.activeRole) {
    case "Admin":
      // Ensure token is a string before passing it
      return token ? <AdminDashboard token={token} userId={user._id} /> : null
    case "Issuer":
      return token ? <IssuerDashboard token={token} userId={user._id} /> : null
    case "User":
      return token ? <UserDashboard token={token} userId={user._id} /> : null
    default:
      return (
        <div className="flex flex-col gap-6 p-6">
          <div>Invalid role</div>
        </div>
      )
  }
}

// Admin Dashboard Component
function AdminDashboard({ token, userId }: { token: string; userId: string }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [users, setUsers] = useState<User[]>([])
  const [affidavits, setAffidavits] = useState<Affidavit[]>([])
  const [issuerRequests, setIssuerRequests] = useState<IssuerRequest[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [isAffidavitsLoading, setIsAffidavitsLoading] = useState(true)
  const [isIssuerRequestsLoading, setIsIssuerRequestsLoading] = useState(true)

  // Fetch users, affidavits, and issuer requests
  useEffect(() => {
    fetchUsers()
    fetchAffidavits()
    fetchIssuerRequests()
  }, [token])

  const fetchUsers = async () => {
    setIsUsersLoading(true)
    try {
      const response = await fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        // Format idCardNumber for each user
        const formattedUsers = data.users.map((user: any) => {
          let formattedIdCard = "N/A"
          if (user.idCardNumber && /^\d{13}$/.test(user.idCardNumber)) {
            const id = user.idCardNumber
            formattedIdCard = `${id.slice(0, 5)}-${id.slice(5, 12)}-${id.slice(12)}`
          }
          return { ...user, formattedIdCardNumber: formattedIdCard }
        })
        setUsers(formattedUsers)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching users",
        variant: "destructive",
      })
    } finally {
      setIsUsersLoading(false)
    }
  }

  const fetchAffidavits = async () => {
    setIsAffidavitsLoading(true)
    try {
      const response = await fetch("/api/affidavits/get-all-admin", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        // Map affidavits to match the expected interface
        const mappedAffidavits = data.affidavits.map((aff: any) => ({
          _id: aff._id,
          displayId: aff.displayId,
          title: aff.title,
          category: aff.category,
          issuerId: aff.issuerId,
          issuerName: aff.issuerId?.name || "Unknown",
          dateIssued: aff.dateIssued || aff.createdAt,
          status: aff.status || "Active",
        }))
        setAffidavits(mappedAffidavits)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch affidavits",
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
      setIsAffidavitsLoading(false)
    }
  }

  const fetchIssuerRequests = async () => {
    setIsIssuerRequestsLoading(true)
    try {
      const response = await fetch("/api/issuer-requests", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        // Map issuer requests to match the expected interface
        const mappedRequests = data.data.map((req: any) => ({
          _id: req._id,
          userId: {
            _id: req.user._id,
            name: req.user.name || "Unknown",
            email: req.user.email || "Unknown",
            idCardNumber: req.user.idCardNumber || "N/A",
          },
          organization: req.organization,
          city: req.city,
          designation: req.designation,
          dateOfJoining: req.dateOfJoining,
          status: req.status,
          remarks: req.remarks,
          createdAt: req.createdAt,
        }))
        setIssuerRequests(mappedRequests)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch issuer requests",
          variant: "destructive",
        })
        setIssuerRequests([])
      }
    } catch (error) {
      console.error("Error fetching issuer requests:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching issuer requests",
        variant: "destructive",
      })
      setIssuerRequests([])
    } finally {
      setIsIssuerRequestsLoading(false)
    }
  }

  // Calculate stats dynamically
  const totalIssuers = users.filter((user) => user.roles.includes("Issuer")).length
  const totalAffidavits = affidavits.length
  const pendingApprovals = issuerRequests.filter((req) => req.status.toLowerCase() === "pending").length

  const stats = [
    {
      title: "Total Users",
      value: users.length.toString(),
      icon: <Users className="h-5 w-5 text-blue-500" />,
      change: "+12 from last month",
      trend: "up",
    },
    {
      title: "Total Issuers",
      value: totalIssuers.toString(),
      icon: <Users className="h-5 w-5 text-purple-500" />,
      change: "+3 from last month",
      trend: "up",
    },
    {
      title: "Total Affidavits",
      value: totalAffidavits.toString(),
      icon: <FileText className="h-5 w-5 text-green-500" />,
      change: "+42 from last month",
      trend: "up",
    },
    {
      title: "Pending Approvals",
      value: pendingApprovals.toString(),
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      change: "+5 from last week",
      trend: "up",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-orange-500 border-orange-500">
            Pending
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "revoked":
        return <Badge variant="destructive">Revoked</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return <Badge className="bg-purple-700">Admin</Badge>
      case "Issuer":
        return <Badge className="bg-blue-600">Issuer</Badge>
      case "User":
        return <Badge variant="outline">User</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const filteredAffidavits = affidavits.filter((affidavit) => {
    const matchesSearch =
      affidavit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.issuerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || affidavit.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.roles.some((role: string) => role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.formattedIdCardNumber !== "N/A" && user.formattedIdCardNumber.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const filteredIssuerRequests = issuerRequests.filter(
    (request) =>
      request.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.userId.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.designation.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleViewUser = (userId: string) => {
    router.push(`/dashboard/users/${userId}`)
  }

  const handleApproveIssuerRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/issuer-requests/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId, action: "approve" }),
      })
      const data = await response.json()
      if (data.success) {
        toast({ title: "Success", description: "Issuer request approved", variant: "default" })
        fetchIssuerRequests()
      } else {
        toast({ title: "Error", description: data.error || "Failed to approve issuer request", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error approving issuer request:", error)
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    }
  }

  const handleRejectIssuerRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/issuer-requests/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId, action: "reject" }),
      })
      const data = await response.json()
      if (data.success) {
        toast({ title: "Success", description: "Issuer request rejected", variant: "default" })
        fetchIssuerRequests()
      } else {
        toast({ title: "Error", description: data.error || "Failed to reject issuer request", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error rejecting issuer request:", error)
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 p-6">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500">Manage users, issuers, and affidavits</p>
        </div>

        {/* Stats Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p
                  className={`text-xs ${
                    stat.trend === "up"
                      ? "text-green-500"
                      : stat.trend === "down"
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="affidavits" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="affidavits">Affidavits</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="issuer-requests">Issuer Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="affidavits">
            <Card>
              <CardHeader>
                <CardTitle>All Affidavits</CardTitle>
                <CardDescription>Manage and monitor all affidavits in the system</CardDescription>
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
                  <div className="flex items-center gap-2">
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
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Issuer</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isAffidavitsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading affidavits...
                        </TableCell>
                      </TableRow>
                    ) : filteredAffidavits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <AlertCircle className="h-10 w-10 mb-2" />
                            <p>No affidavits found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAffidavits.map((affidavit) => (
                        <TableRow key={affidavit._id}>
                          <TableCell className="font-medium">{affidavit.displayId}</TableCell>
                          <TableCell>{affidavit.title}</TableCell>
                          <TableCell>{affidavit.issuerName}</TableCell>
                          <TableCell>{affidavit.category}</TableCell>
                          <TableCell>{new Date(affidavit.dateIssued).toLocaleDateString()}</TableCell>
                          <TableCell>{getStatusBadge(affidavit.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/affidavit/${affidavit.displayId}`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage users and their roles</CardDescription>
                <div className="relative mt-4">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Card Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isUsersLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Users className="h-10 w-10 mb-2" />
                            <p>No users found matching your search criteria</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell className="font-medium">{user.formattedIdCardNumber}</TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {user.roles.map((role: string) => (
                                <span key={role} className="inline-block">{getRoleBadge(role)}</span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleViewUser(user._id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issuer-requests">
            <Card>
              <CardHeader>
                <CardTitle>Issuer Requests</CardTitle>
                <CardDescription>Review and approve requests to become an issuer</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Date of Joining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isIssuerRequestsLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading issuer requests...
                        </TableCell>
                      </TableRow>
                    ) : filteredIssuerRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <AlertCircle className="h-10 w-10 mb-2" />
                            <p>No issuer requests found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredIssuerRequests.map((request) => (
                        <TableRow key={request._id}>
                          <TableCell className="font-medium">{request.userId.name}</TableCell>
                          <TableCell>{request.userId.email}</TableCell>
                          <TableCell>{request.organization}</TableCell>
                          <TableCell>{request.city}</TableCell>
                          <TableCell>{request.designation}</TableCell>
                          <TableCell>{new Date(request.dateOfJoining).toLocaleDateString()}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-right space-x-2">
                            {request.status === "Pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                                  onClick={() => handleApproveIssuerRequest(request._id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                                  onClick={() => handleRejectIssuerRequest(request._id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {request.status !== "Pending" && (
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}

// Issuer Dashboard Component
function IssuerDashboard({ token, userId }: { token: string; userId: string }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedAffidavit, setSelectedAffidavit] = useState<Affidavit | null>(null)
  const [affidavitRequests, setAffidavitRequests] = useState<AffidavitRequest[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)

  useEffect(() => {
    fetchAffidavitRequests()
  }, [userId, token])

  const fetchAffidavitRequests = async () => {
    setIsLoadingRequests(true)
    try {
      const response = await fetch(`/api/affidavits/affidavit-requests/get?userId=${userId}&activeRole=Issuer`, {
        headers: { Authorization: `Bearer ${token}` },
      })
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
      setAffidavitRequests([])
      toast({
        title: "Error",
        description: error.message || "Failed to fetch affidavit requests.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingRequests(false)
    }
  }

  // Calculate stats dynamically
  const totalRequests = affidavitRequests.length
  const pendingRequests = affidavitRequests.filter((req) => req.status.toLowerCase() === "pending").length
  const acceptedRequests = affidavitRequests.filter((req) => req.status.toLowerCase() === "accepted").length
  const rejectedRequests = affidavitRequests.filter((req) => req.status.toLowerCase() === "rejected").length

  const stats = [
    {
      title: "Issued Affidavits",
      value: acceptedRequests.toString(),
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      change: "+10 from last month",
      trend: "up",
    },
    {
      title: "Affidavit Requests",
      value: totalRequests.toString(),
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      change: "+5 from last week",
      trend: "up",
    },
    {
      title: "Flagged Witnesses",
      value: "5",
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      change: "+2 from last month",
      trend: "up",
    },
    {
      title: "Rejected Affidavits",
      value: rejectedRequests.toString(),
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      change: "-3 from last month",
      trend: "down",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "accepted":
        return <Badge className="bg-green-500">Active</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-orange-500 border-orange-500">
            Pending
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredAffidavitRequests = affidavitRequests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.issuerId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.sellerId?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.buyerId?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.witnesses.some((w) => w.contactId.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || request.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const handleViewAffidavit = (request: AffidavitRequest) => {
    setSelectedAffidavit({
      _id: request._id,
      displayId: request.displayId,
      title: request.title,
      category: request.category,
      issuerId: request.issuerId,
      issuerName: request.issuerId.name,
      dateIssued: request.createdAt,
      status: request.status,
    })
    setIsViewDialogOpen(true)
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 p-6">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issuer Dashboard</h1>
          <p className="text-gray-500">Manage affidavits and requests</p>
        </div>

        {/* Stats Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p
                  className={`text-xs ${
                    stat.trend === "up"
                      ? "text-green-500"
                      : stat.trend === "down"
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Affidavits Table */}
        <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">All Affidavits</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>All Affidavit Requests</CardTitle>
              <CardDescription>View and manage affidavit requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingRequests ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading affidavit requests...
                      </TableCell>
                    </TableRow>
                  ) : filteredAffidavitRequests.length > 0 ? (
                    filteredAffidavitRequests.map((request) => (
                      <TableRow key={request._id}>
                        <TableCell className="font-medium">{request.displayId}</TableCell>
                        <TableCell>{request.title}</TableCell>
                        <TableCell>{request.category}</TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleViewAffidavit(request)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <AlertCircle className="h-10 w-10 mb-2" />
                          <p>No affidavit requests found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Tabs>

        {/* View Affidavit Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>View Affidavit Request</DialogTitle>
              <DialogDescription>
                Details of the selected affidavit request.
              </DialogDescription>
            </DialogHeader>
            {selectedAffidavit && (
              <div className="space-y-4">
                <div>
                  <Label>ID</Label>
                  <p className="text-sm text-gray-500">{selectedAffidavit.displayId}</p>
                </div>
                <div>
                  <Label>Title</Label>
                  <p className="text-sm text-gray-500">{selectedAffidavit.title}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="text-sm text-gray-500">{selectedAffidavit.category}</p>
                </div>
                <div>
                  <Label>Date Requested</Label>
                  <p className="text-sm text-gray-500">{new Date(selectedAffidavit.dateIssued).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="text-sm text-gray-500">{selectedAffidavit.status}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}

// User Dashboard Component
function UserDashboard({ token, userId }: { token: string; userId: string }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [affidavits, setAffidavits] = useState<Affidavit[]>([])
  const [isAffidavitsLoading, setIsAffidavitsLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("UserDashboard redirecting to /login")
      toast({
        title: "Session Expired",
        description: "Please log in to continue.",
        variant: "destructive",
      })
      router.push("/login")
    }
    if (userId) {
      fetchAffidavits()
    }
  }, [isLoading, isAuthenticated, router, userId])

  const fetchAffidavits = async () => {
    setIsAffidavitsLoading(true)
    try {
      const response = await fetch(`/api/affidavits/get-all?userId=${userId}&role=User`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        // Map affidavits to match the expected interface
        const mappedAffidavits = data.affidavits.map((aff: any) => ({
          _id: aff._id,
          displayId: aff.displayId,
          title: aff.title,
          category: aff.category,
          issuerId: aff.issuerId,
          issuerName: aff.issuerId?.name || "Unknown",
          dateRequested: aff.dateIssued || aff.createdAt,
          status: aff.status || "Active",
          parties: `${aff.sellerId?.name || "N/A"}, ${aff.buyerId?.name || "N/A"}`,
        }))
        setAffidavits(mappedAffidavits)
      } else {
        setAffidavits([])
        toast({ title: "Error", description: data.error || "Failed to fetch affidavits", variant: "destructive" })
      }
    } catch (error: any) {
      setAffidavits([])
      toast({ title: "Error", description: error.message || "Failed to fetch affidavits.", variant: "destructive" })
    } finally {
      setIsAffidavitsLoading(false)
    }
  }

  // Calculate stats dynamically
  const totalAffidavits = affidavits.length
  const pendingAffidavits = affidavits.filter((aff) => aff.status.toLowerCase() === "pending").length
  const approvedAffidavits = affidavits.filter((aff) => aff.status.toLowerCase() === "active").length
  const rejectedAffidavits = affidavits.filter((aff) => aff.status.toLowerCase() === "rejected").length

  const stats = [
    {
      title: "Total Affidavits",
      value: totalAffidavits.toString(),
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      change: "+2 from last month",
      trend: "up",
    },
    {
      title: "Pending Approval",
      value: pendingAffidavits.toString(),
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      change: "+1 from last week",
      trend: "up",
    },
    {
      title: "Approved",
      value: approvedAffidavits.toString(),
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      change: "Same as last month",
      trend: "neutral",
    },
    {
      title: "Rejected",
      value: rejectedAffidavits.toString(),
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      change: "-1 from last month",
      trend: "down",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-orange-500 border-orange-500">
            Pending
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredAffidavits = affidavits.filter(
    (affidavit) =>
      (affidavit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        affidavit.displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        affidavit.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        affidavit.parties.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (statusFilter === "all" || affidavit.status.toLowerCase() === statusFilter.toLowerCase()) &&
      (categoryFilter === "all" || affidavit.category.toLowerCase() === categoryFilter.toLowerCase())
  )

  const handleLogout = () => {
    logout()
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-gray-500">Manage your affidavits and requests</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <FilePlus className="h-4 w-4" />
              <span>Request New Affidavit</span>
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p
                  className={`text-xs ${
                    stat.trend === "up"
                      ? "text-green-500"
                      : stat.trend === "down"
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">All Affidavits</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Affidavits</CardTitle>
              <CardDescription>View and manage your recent affidavit requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isAffidavitsLoading ? (
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
                        <TableCell>{new Date(affidavit.dateRequested).toLocaleDateString()}</TableCell>
                        <TableCell>{affidavit.parties}</TableCell>
                        <TableCell>{getStatusBadge(affidavit.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/affidavit/${affidavit.displayId}`}>View</Link>
                          </Button>
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
        </Tabs>
        <CreateAffidavitDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      </div>
    </ProtectedRoute>
  )
}




//earlier 1191 lines then 1408 then 1252  was also working