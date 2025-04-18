"use client"

import { useState } from "react"
import { Users, FileText, Clock, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardLayout from "@/components/dashboard-layout"

export default function AdminDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Mock data for admin dashboard
  const stats = [
    {
      title: "Total Users",
      value: "124",
      icon: <Users className="h-5 w-5 text-blue-500" />,
      change: "+12 from last month",
      trend: "up",
    },
    {
      title: "Total Issuers",
      value: "18",
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

  const users = [
    {
      id: "USR-001",
      name: "John Doe",
      email: "john.doe@example.com",
      role: "User",
      status: "Active",
      joinDate: "2025-01-15",
    },
    {
      id: "USR-002",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "Issuer",
      status: "Active",
      joinDate: "2025-01-20",
    },
    {
      id: "USR-003",
      name: "Robert Johnson",
      email: "robert.johnson@example.com",
      role: "User",
      status: "Inactive",
      joinDate: "2025-02-05",
    },
    {
      id: "USR-004",
      name: "Sarah Williams",
      email: "sarah.williams@example.com",
      role: "Issuer",
      status: "Pending",
      joinDate: "2025-02-28",
    },
    {
      id: "USR-005",
      name: "Michael Brown",
      email: "michael.brown@example.com",
      role: "Admin",
      status: "Active",
      joinDate: "2024-12-10",
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
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500">Manage users, issuers, and affidavits</p>
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
                    stat.trend === "up" ? "text-green-500" : stat.trend === "down" ? "text-red-500" : "text-gray-500"
                  }`}
                >
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

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
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{user.joinDate}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
    </DashboardLayout>
  )
}
