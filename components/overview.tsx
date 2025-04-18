"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react"

interface OverviewProps {
  title?: string
  description?: string
}

export function Overview({
  title = "Dashboard Overview",
  description = "View the statistics about your account",
}: OverviewProps) {
  // Fetch state from localStorage for demo
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole")
    if (storedRole) {
      setUserRole(storedRole)
    }
  }, [])

  // Mock data for dashboard
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

  // Admin-specific stats
  const adminStats = [
    {
      title: "Total Users",
      value: "124",
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      change: "+12 from last month",
      trend: "up",
    },
    {
      title: "Total Issuers",
      value: "18",
      icon: <Clock className="h-5 w-5 text-purple-500" />,
      change: "+3 from last month",
      trend: "up",
    },
    {
      title: "Total Affidavits",
      value: "356",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      change: "+42 from last month",
      trend: "up",
    },
    {
      title: "Pending Approvals",
      value: "24",
      icon: <XCircle className="h-5 w-5 text-orange-500" />,
      change: "+5 from last week",
      trend: "up",
    },
  ]

  // Choose stats based on user role
  const displayStats = userRole === "Admin" ? adminStats : stats

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {displayStats.map((stat, index) => (
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
    </div>
  )
}
