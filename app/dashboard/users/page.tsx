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
import { Eye, MoreHorizontal, Search, UserPlus, Ban, Edit, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function UsersPage() {
  const router = useRouter()
  const { user, token, isLoading: isAuthLoading, isAuthenticated } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [banReason, setBanReason] = useState("")

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

  // Search functionality
  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter((user) => {
        const query = searchQuery.toLowerCase();
        return (
          (user.name || "").toLowerCase().includes(query) ||
          (user.email || "").toLowerCase().includes(query) ||
          (user.roles || []).some((role: string) => role.toLowerCase().includes(query)) ||
          (user.status || "").toLowerCase().includes(query) ||
          String(user.affidavitsCount || 0).includes(query) ||
          (user.createdAt || "").toLowerCase().includes(query) ||
          (user.status === "Banned" && (user.remarks || "").toLowerCase().includes(query))
        );
      });
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

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
        setFilteredUsers(data.users)
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

  const handleViewUser = (userId: string) => {
    router.push(`/dashboard/users/${userId}`)
  }

  const handleOpenBanDialog = (user: any) => {
    setSelectedUser(user)
    setBanReason("")
    setIsBanDialogOpen(true)
  }

  const handleBanUser = async () => {
    if (!selectedUser || !banReason) return

    try {
      const response = await fetch("/api/user/admin-update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          status: "Banned",
          remarks: banReason,
        }),
      })
      const data = await response.json()
      if (data.success) {
        const updatedUsers = users.map((user) =>
          user._id === selectedUser._id ? { ...user, status: "Banned", remarks: banReason } : user
        )
        setUsers(updatedUsers)
        setIsBanDialogOpen(false)
      } else {
        console.error("Error banning user:", data.error)
      }
    } catch (error) {
      console.error("Error banning user:", error)
    }
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
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-gray-500">Manage users and issuers in the system</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button onClick={() => router.push("/dashboard/users/new")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      {/* Users Table Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Users</CardTitle>
          <CardDescription>A list of all users and issuers in the system.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Affidavits</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <User className="h-10 w-10 mb-2" />
                      <p>No users found matching your search criteria</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="flex flex-wrap gap-1">{getRoleBadges(user.roles)}</TableCell>
                    <TableCell>{getUserStatusBadge(user.status)}</TableCell>
                    <TableCell>{user.affidavitsCount || 0}</TableCell>
                    <TableCell>{user.createdAt}</TableCell>
                    <TableCell>{user.status === "Banned" ? user.remarks || "N/A" : "-"}</TableCell>
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
                          {user.status !== "Banned" && (
                            <DropdownMenuItem onClick={() => handleOpenBanDialog(user)}>
                              <Ban className="mr-2 h-4 w-4" />
                              Ban User
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

      {/* Ban User Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent className="max-w-lg">
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
        <DialogContent className="max-w-lg">
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


//earlier 496 something lines