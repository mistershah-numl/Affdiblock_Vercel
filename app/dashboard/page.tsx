"use client"

// Ensure this export comes after "use client"
export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamicImport from "next/dynamic"
import { Users, FileText, Clock, Search, Filter, FilePlus, CheckCircle, XCircle, AlertCircle, Flag, Edit, Eye, MoreVertical } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Dynamically import CreateAffidavitDialog for client-side rendering
const CreateAffidavitDialog = dynamicImport(() => import("@/components/create-affidavit-dialog"), {
  ssr: false,
  loading: () => <div>Loading affidavit dialog...</div>,
})

// Define interfaces for TypeScript
interface Affidavit {
  id: string
  title: string
  category: string
  dateIssued: string
  parties: string
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
      return token ? <AdminDashboard token={token} /> : null
    case "Issuer":
      return <IssuerDashboard />
    case "User":
      return <UserDashboard />
    default:
      return (
        <div className="flex flex-col gap-6 p-6">
          <div>Invalid role</div>
        </div>
      )
  }
}

// Admin Dashboard Component (Updated)
function AdminDashboard({ token }: { token: string }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [users, setUsers] = useState<User[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(true)

  // Fetch users when the component mounts
  useEffect(() => {
    fetchUsers()
  }, [])

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

  // Calculate total issuers by filtering users with the "Issuer" role
  const totalIssuers = users.filter((user) => user.roles.includes("Issuer")).length

  const stats = [
    {
      title: "Total Users",
      value: users.length.toString(), // Dynamically set the total users
      icon: <Users className="h-5 w-5 text-blue-500" />,
      change: "+12 from last month",
      trend: "up",
    },
    {
      title: "Total Issuers",
      value: totalIssuers.toString(), // Dynamically set the total issuers
      icon: <Users className="h-5 w-5 text-purple-500" />,
      change: "+3 from last month",
      trend: "up",
    },
    {
      title: "Total Affidavits",
      value: "356",
      icon: <FileText className="h-5 w-5 text-green-500" />,
      change: "+42 from last month",
      trend: "up",
    },
    {
      title: "Pending Approvals",
      value: "24",
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      change: "+5 from last week",
      trend: "up",
    },
  ]

  const affidavits = [
    {
      id: "AFF-2025-001",
      title: "Property Transfer Deed",
      issuer: "Jane Smith",
      category: "Property",
      dateIssued: "2025-03-10",
      status: "Active",
    },
    {
      id: "AFF-2025-002",
      title: "Vehicle Ownership Transfer",
      issuer: "Jane Smith",
      category: "Vehicle",
      dateIssued: "2025-03-08",
      status: "Pending",
    },
    {
      id: "AFF-2025-003",
      title: "Business Partnership Agreement",
      issuer: "David Wilson",
      category: "Business",
      dateIssued: "2025-03-05",
      status: "Active",
    },
    {
      id: "AFF-2025-004",
      title: "Rental Agreement",
      issuer: "David Wilson",
      category: "Property",
      dateIssued: "2025-03-01",
      status: "Rejected",
    },
    {
      id: "AFF-2025-005",
      title: "Motorcycle Sale Agreement",
      issuer: "Jane Smith",
      category: "Vehicle",
      dateIssued: "2025-02-28",
      status: "Revoked",
    },
  ]

  const issuerRequests = [
    {
      id: "REQ-001",
      name: "David Wilson",
      email: "david.wilson@example.com",
      licenseNumber: "ATR-12345",
      requestDate: "2025-03-05",
      status: "Pending",
    },
    {
      id: "REQ-002",
      name: "Emma Taylor",
      email: "emma.taylor@example.com",
      licenseNumber: "ATR-67890",
      requestDate: "2025-03-02",
      status: "Approved",
    },
    {
      id: "REQ-003",
      name: "Alex Martin",
      email: "alex.martin@example.com",
      licenseNumber: "ATR-54321",
      requestDate: "2025-02-28",
      status: "Rejected",
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
        return <Badge variant="destructive">Revoked</Badge>
      case "Inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "Approved":
        return <Badge className="bg-green-500">Approved</Badge>
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
      affidavit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const handleViewUser = (userId: string) => {
    router.push(`/dashboard/users/${userId}`)
  }

  const handleEditUser = (user: User) => {
    router.push(`/dashboard/users/edit/${user._id}`)
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
                    {filteredAffidavits.map((affidavit) => (
                      <TableRow key={affidavit.id}>
                        <TableCell className="font-medium">{affidavit.id}</TableCell>
                        <TableCell>{affidavit.title}</TableCell>
                        <TableCell>{affidavit.issuer}</TableCell>
                        <TableCell>{affidavit.category}</TableCell>
                        <TableCell>{affidavit.dateIssued}</TableCell>
                        <TableCell>{getStatusBadge(affidavit.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewUser(user._id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
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
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>License Number</TableHead>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issuerRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.id}</TableCell>
                        <TableCell>{request.name}</TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>{request.licenseNumber}</TableCell>
                        <TableCell>{request.requestDate}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          {request.status === "Pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
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
                    ))}
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

// Issuer Dashboard Component (Unchanged)
function IssuerDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [selectedAffidavit, setSelectedAffidavit] = useState<Affidavit | null>(null)

  const stats = [
    {
      title: "Issued Affidavits",
      value: "150",
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      change: "+10 from last month",
      trend: "up",
    },
    {
      title: "Affidavit Requests",
      value: "20",
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      change: "+5 from last week",
      trend: "up",
    },
    {
      title: "Flagged Witnesses",
      value: "5",
      icon: <Flag className="h-5 w-5 text-red-500" />,
      change: "+2 from last month",
      trend: "up",
    },
    {
      title: "Rejected Affidavits",
      value: "8",
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      change: "-3 from last month",
      trend: "down",
    },
  ]

  const affidavits: Affidavit[] = [
    {
      id: "AFF-2025-001",
      title: "Property Transfer Deed",
      category: "Property",
      dateIssued: "2025-03-10",
      parties: "John Doe, Jane Smith",
      status: "Active",
    },
    {
      id: "AFF-2025-002",
      title: "Vehicle Ownership Transfer",
      category: "Vehicle",
      dateIssued: "2025-03-08",
      parties: "Mike Johnson, Sarah Williams",
      status: "Pending",
    },
    {
      id: "AFF-2025-003",
      title: "Business Partnership Agreement",
      category: "Business",
      dateIssued: "2025-03-05",
      parties: "Robert Brown, Lisa Davis",
      status: "Active",
    },
    {
      id: "AFF-2025-004",
      title: "Rental Agreement",
      category: "Property",
      dateIssued: "2025-03-01",
      parties: "David Wilson, Emma Taylor",
      status: "Rejected",
    },
    {
      id: "AFF-2025-005",
      title: "Motorcycle Sale Agreement",
      category: "Vehicle",
      dateIssued: "2025-02-28",
      parties: "Alex Martin, Olivia Moore",
      status: "Active",
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
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredAffidavits = affidavits.filter(
    (affidavit) =>
      affidavit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.parties.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleViewAffidavit = (affidavit: Affidavit) => {
    setSelectedAffidavit(affidavit)
    setIsViewDialogOpen(true)
  }

  const handleChangeStatus = (affidavit: Affidavit) => {
    setSelectedAffidavit(affidavit)
    setIsStatusDialogOpen(true)
  }

  const handleMarkFakeWitnesses = (affidavit: Affidavit) => {
    toast({
      title: "Fake Witnesses Marked",
      description: `Witnesses for affidavit ${affidavit.id} have been flagged as fake.`,
      variant: "default",
    })
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
        <Tabs defaultValue="all" className="w-full">
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
              <CardTitle>All Affidavits</CardTitle>
              <CardDescription>View and manage affidavits</CardDescription>
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
                  {filteredAffidavits.length > 0 ? (
                    filteredAffidavits.map((affidavit) => (
                      <TableRow key={affidavit.id}>
                        <TableCell className="font-medium">{affidavit.id}</TableCell>
                        <TableCell>{affidavit.title}</TableCell>
                        <TableCell>{affidavit.category}</TableCell>
                        <TableCell>{affidavit.dateIssued}</TableCell>
                        <TableCell>{affidavit.parties}</TableCell>
                        <TableCell>{getStatusBadge(affidavit.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewAffidavit(affidavit)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeStatus(affidavit)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Change Status
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMarkFakeWitnesses(affidavit)}>
                                <Flag className="h-4 w-4 mr-2" />
                                Mark Fake Witnesses
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
        </Tabs>

        {/* View Affidavit Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>View Affidavit</DialogTitle>
              <DialogDescription>
                Details of the selected affidavit.
              </DialogDescription>
            </DialogHeader>
            {selectedAffidavit && (
              <div className="space-y-4">
                <div>
                  <Label>ID</Label>
                  <p className="text-sm text-gray-500">{selectedAffidavit.id}</p>
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
                  <Label>Date Issued</Label>
                  <p className="text-sm text-gray-500">{selectedAffidavit.dateIssued}</p>
                </div>
                <div>
                  <Label>Parties</Label>
                  <p className="text-sm text-gray-500">{selectedAffidavit.parties}</p>
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

        {/* Change Status Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Affidavit Status</DialogTitle>
              <DialogDescription>
                Update the status of the affidavit.
              </DialogDescription>
            </DialogHeader>
            {selectedAffidavit && (
              <div className="space-y-4">
                <div>
                  <Label>ID</Label>
                  <p className="text-sm text-gray-500">{selectedAffidavit.id}</p>
                </div>
                <div>
                  <Label>Title</Label>
                  <p className="text-sm text-gray-500">{selectedAffidavit.title}</p>
                </div>
                <div>
                  <Label>Current Status</Label>
                  <p className="text-sm text-gray-500">{selectedAffidavit.status}</p>
                </div>
                <div>
                  <Label>New Status</Label>
                  <Select defaultValue={selectedAffidavit.status}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reason for Change</Label>
                  <Input placeholder="Enter reason for status change" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}

// User Dashboard Component (Unchanged)
function UserDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    console.log("UserDashboard auth state:", { isLoading, isAuthenticated, user: user?.email })
    if (!isLoading && !isAuthenticated) {
      console.log("UserDashboard redirecting to /login")
      toast({
        title: "Session Expired",
        description: "Please log in to continue.",
        variant: "destructive",
      })
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  const stats = [
    {
      title: "Total Affidavits",
      value: "12",
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      change: "+2 from last month",
      trend: "up",
    },
    {
      title: "Pending Approval",
      value: "3",
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      change: "+1 from last week",
      trend: "up",
    },
    {
      title: "Approved",
      value: "8",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      change: "Same as last month",
      trend: "neutral",
    },
    {
      title: "Rejected",
      value: "1",
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      change: "-1 from last month",
      trend: "down",
    },
  ]

  const recentAffidavits = [
    {
      id: "AFF-2025-001",
      title: "Property Transfer Deed",
      category: "Property",
      dateRequested: "2025-03-10",
      status: "Active",
      parties: "John Doe, Jane Smith",
    },
    {
      id: "AFF-2025-002",
      title: "Vehicle Ownership Transfer",
      category: "Vehicle",
      dateRequested: "2025-03-08",
      status: "Pending",
      parties: "Mike Johnson, Sarah Williams",
    },
    {
      id: "AFF-2025-003",
      title: "Business Partnership Agreement",
      category: "Business",
      dateRequested: "2025-03-05",
      status: "Active",
      parties: "Robert Brown, Lisa Davis",
    },
    {
      id: "AFF-2025-004",
      title: "Rental Agreement",
      category: "Property",
      dateRequested: "2025-03-01",
      status: "Rejected",
      parties: "David Wilson, Emma Taylor",
    },
    {
      id: "AFF-2025-005",
      title: "Motorcycle Sale Agreement",
      category: "Vehicle",
      dateRequested: "2025-02-28",
      status: "Active",
      parties: "Alex Martin, Olivia Moore",
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
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredAffidavits = recentAffidavits.filter(
    (affidavit) =>
      affidavit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affidavit.parties.toLowerCase().includes(searchQuery.toLowerCase()),
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
        <Tabs defaultValue="all" className="w-full">
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
                  {filteredAffidavits.length > 0 ? (
                    filteredAffidavits.map((affidavit) => (
                      <TableRow key={affidavit.id}>
                        <TableCell className="font-medium">{affidavit.id}</TableCell>
                        <TableCell>{affidavit.title}</TableCell>
                        <TableCell>{affidavit.category}</TableCell>
                        <TableCell>{affidavit.dateRequested}</TableCell>
                        <TableCell>{affidavit.parties}</TableCell>
                        <TableCell>{getStatusBadge(affidavit.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/affidavit/${affidavit.id}`}>View</Link>
                          </Button>
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
        </Tabs>
        <CreateAffidavitDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      </div>
    </ProtectedRoute>
  )
}