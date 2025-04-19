"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { FileText, FilePlus, Clock, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast"

const CreateAffidavitDialog = dynamic(() => import("@/components/create-affidavit-dialog"), {
  ssr: false,
  loading: () => <div>Loading affidavit dialog...</div>,
})

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    console.log("DashboardPage auth state:", { isLoading, isAuthenticated, user: user?.email })
    if (!isLoading && !isAuthenticated) {
      console.log("DashboardPage redirecting to /login")
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
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
      </div>
      <CreateAffidavitDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </DashboardLayout>
  )
}