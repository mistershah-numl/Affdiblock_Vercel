"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, MoreHorizontal, Search, Ban, Edit, User, AlertTriangle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"

export default function BannedUsersPage() {
  const router = useRouter()
  const { user, token, isLoading: isAuthLoading, isAuthenticated } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [bannedUsers, setBannedUsers] = useState<any[]>([])
  const [filteredBannedUsers, setFilteredBannedUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editUserData, setEditUserData] = useState<any>({})

  // Check if the user is an Admin and redirect if not
  useEffect(() => {
    if (isAuthLoading) return // Wait for auth to load

    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    if (user.activeRole !== "Admin") {
      router.push("/dashboard")
      return
    }

    // If the user is an Admin, fetch users
    fetchUsers()
  }, [isAuthLoading, isAuthenticated, user, router])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
        const banned = data.users.filter((u: any) => u.status === "Banned")
        setBannedUsers(banned)
        setFilteredBannedUsers(banned)
      } else {
        console.error("Error fetching users:", data.error)
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  // Search functionality
  useEffect(() => {
    if (searchQuery) {
      const filtered = bannedUsers.filter((user) => {
        const query = searchQuery.toLowerCase();
        return (
          (user.name || "").toLowerCase().includes(query) ||
          (user.email || "").toLowerCase().includes(query) ||
          (user.remarks || "").toLowerCase().includes(query)
        );
      });
      setFilteredBannedUsers(filtered)
    } else {
      setFilteredBannedUsers(bannedUsers)
    }
  }, [searchQuery, bannedUsers])

  // Calculate stats dynamically
  const now = new Date()
  const totalBanned = bannedUsers.length
  const thisMonthBanned = bannedUsers.filter((u: any) => {
    const date = new Date(u.createdAt)
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  }).length
  const thisYearBanned = bannedUsers.filter((u: any) => {
    const date = new Date(u.createdAt)
    return date.getFullYear() === now.getFullYear()
  }).length

  const stats = [
    {
      title: "Total Banned Users",
      value: totalBanned.toString(),
      icon: <Ban className="h-5 w-5 text-red-500" />,
      change: "+5 from last month",
      trend: "up",
    },
    {
      title: "Banned This Month",
      value: thisMonthBanned.toString(),
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
      change: "+2 from last week",
      trend: "up",
    },
    {
      title: "Banned This Year",
      value: thisYearBanned.toString(),
      icon: <Ban className="h-5 w-5 text-red-500" />,
      change: "+15 from last year",
      trend: "up",
    },
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  const handleViewUser = (userId: string) => {
    router.push(`/dashboard/users/${userId}`)
  }

  const handleOpenEditDialog = (user: any) => {
    setEditUserData({
      _id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles || [],
      activeRole: user.activeRole,
      status: user.status,
      remarks: user.remarks || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!editUserData._id) return

    try {
      // Ensure 'User' role is included
      const rolesToSend = editUserData.roles.length > 0 ? editUserData.roles : ["User"];
      const response = await fetch("/api/user/admin-update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: editUserData._id,
          name: editUserData.name,
          email: editUserData.email,
          roles: rolesToSend,
          activeRole: editUserData.activeRole,
          status: editUserData.status,
          remarks: editUserData.status === "Banned" ? editUserData.remarks : undefined,
        }),
      })
      const data = await response.json()
      if (data.success) {
        const updatedUsers = users.map((user) =>
          user._id === editUserData._id
            ? {
                ...user,
                name: editUserData.name,
                email: editUserData.email,
                roles: data.user.roles, // Use server-returned roles to ensure consistency
                activeRole: data.user.activeRole,
                status: editUserData.status,
                remarks: editUserData.status === "Banned" ? editUserData.remarks : undefined,
              }
            : user
        )
        setUsers(updatedUsers)
        // Update banned users list
        const updatedBanned = updatedUsers.filter((u: any) => u.status === "Banned")
        setBannedUsers(updatedBanned)
        setFilteredBannedUsers(updatedBanned)
        setIsEditDialogOpen(false)
      } else {
        console.error("Error updating user:", data.error)
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleRoleCheckboxChange = (role: string, checked: boolean) => {
    setEditUserData((prev: any) => {
      if (role === "User" && !checked) {
        // Prevent unchecking the 'User' role
        return prev;
      }
      const newRoles = checked
        ? [...prev.roles, role]
        : prev.roles.filter((r: string) => r !== role);
      return { ...prev, roles: newRoles };
    });
  };

  // Show loading state while checking authentication
  if (isAuthLoading || !user) {
    return <div>Loading...</div>
  }

  // This should already be handled by the useEffect redirect, but adding for clarity
  if (!isAuthenticated || user.activeRole !== "Admin") {
    return null
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banned Users</h1>
          <p className="text-gray-500">Manage users who have been banned from the platform</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search banned users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid gap-4 md:grid-cols-3">
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
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Banned Users</TabsTrigger>
        </TabsList>

        {/* All Banned Users Tab */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Banned Users</CardTitle>
              <CardDescription>A list of all users who have been banned from the platform.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading banned users...
                      </TableCell>
                    </TableRow>
                  ) : filteredBannedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Ban className="h-10 w-10 mb-2" />
                          <p>No banned users found matching your search criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBannedUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.remarks || "No reason provided"}</TableCell>
                        <TableCell>
                          <Badge className="bg-red-500">Banned</Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewUser(user._id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
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
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and status. You can unban by setting status to Active.</DialogDescription>
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
                      disabled={role === "User"} // Disable User checkbox to prevent unchecking
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
                  {editUserData.roles?.map((role: string) => (
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
                  <SelectItem value="Inactive">Inactive</SelectItem>
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
    </div>
  )
}