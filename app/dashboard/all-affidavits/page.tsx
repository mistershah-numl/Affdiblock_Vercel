"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, MoreHorizontal, Search, AlertTriangle, Filter, FileText, CheckCircle, Ban, XCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { toast } from "@/components/ui/use-toast"

export default function AllAffidavitsPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth()
  const [affidavits, setAffidavits] = useState<any[]>([])
  const [filteredAffidavits, setFilteredAffidavits] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !user || user.activeRole !== "Admin") {
      router.push("/dashboard")
      return
    }
    fetchAffidavits()
  }, [isAuthenticated, user, token, router])

  useEffect(() => {
    if (searchQuery) {
      const filtered = affidavits.filter(
        (affidavit) =>
          affidavit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          affidavit.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          affidavit.issuerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          affidavit.displayId.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredAffidavits(filtered)
    } else {
      setFilteredAffidavits(affidavits)
    }
  }, [searchQuery, affidavits])

  const fetchAffidavits = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/affidavits/get-all-admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        // Map to include requesterName as issuerName for consistency
        const mappedAffidavits = data.affidavits.map((aff: any) => ({
          ...aff,
          requesterName: aff.issuerName || aff.issuerId?.name || "Unknown",
        }))
        setAffidavits(mappedAffidavits)
        setFilteredAffidavits(mappedAffidavits)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch all affidavits",
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
      setIsLoading(false)
    }
  }

  // Calculate stats dynamically
  const totalAffidavits = affidavits.length
  const activeAffidavits = affidavits.filter((aff) => aff.status === "Active" || aff.status === "Accepted").length
  const revokedAffidavits = affidavits.filter((aff) => aff.status === "Revoked").length
  const tamperedAffidavits = affidavits.filter((aff) => aff.isVerifiedOnBlockchain === false && aff.transactionHash).length

  const stats = [
    {
      title: "Total Affidavits",
      value: totalAffidavits.toString(),
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      change: "+42 from last month",
      trend: "up",
    },
    {
      title: "Active Affidavits",
      value: activeAffidavits.toString(),
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      change: "+20 from last month",
      trend: "up",
    },
    {
      title: "Revoked Affidavits",
      value: revokedAffidavits.toString(),
      icon: <Ban className="h-5 w-5 text-gray-500" />,
      change: "+5 from last month",
      trend: "up",
    },
    {
      title: "Tampered Affidavits",
      value: tamperedAffidavits.toString(),
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      change: "+2 from last month",
      trend: "up",
    },
  ]

  const handleViewAffidavit = (displayId: string) => {
    router.push(`/affidavit/${displayId}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
      case "Accepted":
        return <Badge className="bg-green-500">Active</Badge>
      case "Rejected":
        return <Badge className="bg-red-500">Rejected</Badge>
      case "Revoked":
        return <Badge className="bg-gray-500">Revoked</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getBlockchainStatusBadge = (affidavit: any) => {
    if (affidavit.transactionHash) {
      if (affidavit.isVerifiedOnBlockchain === true) {
        return <Badge className="bg-green-100 text-green-800">Authentic</Badge>
      } else if (affidavit.isVerifiedOnBlockchain === false) {
        return <Badge className="bg-red-100 text-red-800">Tampered</Badge>
      } else {
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Verification</Badge>
      }
    } else {
      return <Badge variant="secondary">Not on Blockchain</Badge>
    }
  }

  const filteredByStatus = filteredAffidavits.filter(
    (affidavit) => statusFilter === "all" || affidavit.status.toLowerCase() === statusFilter.toLowerCase()
  )

  if (authLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 p-6">
        {/* Header Section - Responsive */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">All Affidavits</h1>
            <p className="text-sm md:text-base text-gray-500">View and manage all affidavits in the system</p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search affidavits..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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

        {/* Filter Section */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Affidavits Table Section - Responsive */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg md:text-xl">System Affidavits</CardTitle>
            <CardDescription className="text-sm">A comprehensive list of all affidavits across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">ID</TableHead>
                    <TableHead className="whitespace-nowrap">Title</TableHead>
                    <TableHead className="whitespace-nowrap">Category</TableHead>
                    <TableHead className="whitespace-nowrap">Issuer</TableHead>
                    <TableHead className="whitespace-nowrap">Date Issued</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Blockchain Status</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading affidavits...
                      </TableCell>
                    </TableRow>
                  ) : filteredByStatus.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <AlertTriangle className="h-10 w-10 mb-2" />
                          <p className="text-sm">No affidavits found matching your criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredByStatus.map((affidavit) => (
                      <TableRow key={affidavit._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm">{affidavit.displayId}</TableCell>
                        <TableCell className="text-sm">{affidavit.title}</TableCell>
                        <TableCell className="text-sm">{affidavit.category}</TableCell>
                        <TableCell className="text-sm">{affidavit.requesterName}</TableCell>
                        <TableCell className="text-sm">{new Date(affidavit.dateIssued || affidavit.dateRequested).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(affidavit.status)}</TableCell>
                        <TableCell>{getBlockchainStatusBadge(affidavit)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col sm:flex-row justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewAffidavit(affidavit.displayId)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}


//earlier 242 lines