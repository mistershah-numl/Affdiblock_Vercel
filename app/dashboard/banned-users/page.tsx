"use client"

import { useState } from "react"
import { Ban, CheckCircle, MoreHorizontal, Search, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BannedUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for banned users
  const bannedUsers = [
    {
      id: "1",
      name: "Alex Johnson",
      email: "alex.johnson@example.com",
      reason: "Multiple fraudulent affidavits",
      status: "Permanent",
      date: "2023-05-15",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "AJ",
    },
    {
      id: "2",
      name: "Sarah Williams",
      email: "sarah.williams@example.com",
      reason: "Identity verification failure",
      status: "Temporary",
      date: "2023-06-22",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "SW",
    },
    {
      id: "3",
      name: "Michael Brown",
      email: "michael.brown@example.com",
      reason: "Violation of terms of service",
      status: "Permanent",
      date: "2023-04-10",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "MB",
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily.davis@example.com",
      reason: "Suspicious activity",
      status: "Under Review",
      date: "2023-07-05",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "ED",
    },
    {
      id: "5",
      name: "David Wilson",
      email: "david.wilson@example.com",
      reason: "Multiple failed login attempts",
      status: "Temporary",
      date: "2023-06-30",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "DW",
    },
  ]

  // Filter banned users based on search query
  const filteredUsers = bannedUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.reason.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            type="search"
            placeholder="Search banned users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Banned Users</TabsTrigger>
          <TabsTrigger value="permanent">Permanent</TabsTrigger>
          <TabsTrigger value="temporary">Temporary</TabsTrigger>
          <TabsTrigger value="review">Under Review</TabsTrigger>
        </TabsList>

        {/* All Banned Users Tab */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Banned Users</CardTitle>
              <CardDescription>A list of all users who have been banned from the platform.</CardDescription>
            </CardHeader>
            <CardContent>
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
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.reason}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === "Permanent"
                                ? "destructive"
                                : user.status === "Temporary"
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.date}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span>Unban User</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Ban className="mr-2 h-4 w-4" />
                                <span>Change Ban Status</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <UserX className="mr-2 h-4 w-4" />
                                <span>Delete Account</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Ban className="h-10 w-10 mb-2" />
                          <p>No banned users found matching your search criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permanent Ban Tab */}
        <TabsContent value="permanent" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Permanently Banned Users</CardTitle>
              <CardDescription>Users who have been permanently banned from the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers
                    .filter((user) => user.status === "Permanent")
                    .length > 0 ? (
                    filteredUsers
                      .filter((user) => user.status === "Permanent")
                      .map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.reason}</TableCell>
                          <TableCell>{user.date}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  <span>Unban User</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Ban className="mr-2 h-4 w-4" />
                                  <span>Change Ban Status</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <UserX className="mr-2 h-4 w-4" />
                                  <span>Delete Account</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Ban className="h-10 w-10 mb-2" />
                          <p>No permanently banned users found matching your search criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Temporary Ban Tab */}
        <TabsContent value="temporary" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Temporarily Banned Users</CardTitle>
              <CardDescription>Users who have been temporarily banned from the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers
                    .filter((user) => user.status === "Temporary")
                    .length > 0 ? (
                    filteredUsers
                      .filter((user) => user.status === "Temporary")
                      .map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.reason}</TableCell>
                          <TableCell>{user.date}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  <span>Unban User</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Ban className="mr-2 h-4 w-4" />
                                  <span>Change Ban Status</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <UserX className="mr-2 h-4 w-4" />
                                  <span>Delete Account</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Ban className="h-10 w-10 mb-2" />
                          <p>No temporarily banned users found matching your search criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Under Review Tab */}
        <TabsContent value="review" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Users Under Review</CardTitle>
              <CardDescription>
                Users who have been banned but are under review for potential reinstatement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers
                    .filter((user) => user.status === "Under Review")
                    .length > 0 ? (
                    filteredUsers
                      .filter((user) => user.status === "Under Review")
                      .map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.reason}</TableCell>
                          <TableCell>{user.date}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  <span>Unban User</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Ban className="mr-2 h-4 w-4" />
                                  <span>Change Ban Status</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <UserX className="mr-2 h-4 w-4" />
                                  <span>Delete Account</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Ban className="h-10 w-10 mb-2" />
                          <p>No users under review found matching your search criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}