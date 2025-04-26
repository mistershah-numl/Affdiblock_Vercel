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
import { Eye, MoreHorizontal, Search, UserPlus, Ban, Edit, User } from "lucide-react"
import { getAllUsers, banUser, updateUser } from "@/lib/api/users"

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [banReason, setBanReason] = useState("")
  const [banDuration, setBanDuration] = useState("Permanent")

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editUserData, setEditUserData] = useState<any>({})

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.role.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await getAllUsers()
      if (response.success) {
        setUsers(response.users)
        setFilteredUsers(response.users)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
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
    setBanDuration("Permanent")
    setIsBanDialogOpen(true)
  }

  const handleBanUser = async () => {
    if (!selectedUser || !banReason) return

    try {
      const response = await banUser(selectedUser._id, banReason, banDuration)
      if (response.success) {
        const updatedUsers = users.map((user) =>
          user._id === selectedUser._id ? { ...user, status: "Banned", banReason, banDuration } : user,
        )
        setUsers(updatedUsers)
        setIsBanDialogOpen(false)
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
      role: user.role,
      status: user.status,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!editUserData._id) return

    try {
      const response = await updateUser(editUserData._id, editUserData)
      if (response.success) {
        const updatedUsers = users.map((user) => (user._id === editUserData._id ? { ...user, ...editUserData } : user))
        setUsers(updatedUsers)
        setIsEditDialogOpen(false)
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Affidavits</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
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
                    <TableCell>
                      {user.role === "Issuer" ? (
                        <Badge className="bg-blue-500">Issuer</Badge>
                      ) : user.role === "Admin" ? (
                        <Badge className="bg-purple-500">Admin</Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getUserStatusBadge(user.status)}</TableCell>
                    <TableCell>{user.affidavitsCount || 0}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
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