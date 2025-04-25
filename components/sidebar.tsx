"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  FileText,
  Home,
  LayoutDashboard,
  Settings,
  Users,
  Flag,
  ShieldCheck,
  UserCheck,
  FileCheck,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

// Mock authentication state - in a real app, this would come from an auth provider
const isAuthenticated = true
const userRole = "admin" // Options: "user", "issuer", "admin"

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()
  const isDashboard = pathname.includes("/dashboard") || pathname.includes("/admin") || pathname.includes("/issuer")

  // If not on a dashboard page, don't render the sidebar
  if (!isDashboard || !isAuthenticated) {
    return null
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  // Define sidebar items based on user role
  const getSidebarItems = () => {
    const commonItems = [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
      {
        title: "Profile",
        href: "/dashboard/profile",
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: <Settings className="h-5 w-5" />,
      },
    ]

    const userItems = [
      {
        title: "My Affidavits",
        href: "/dashboard/affidavits",
        icon: <FileText className="h-5 w-5" />,
      },
    ]

    const issuerItems = [
      {
        title: "Issued Affidavits",
        href: "/dashboard/issued-affidavits",
        icon: <FileCheck className="h-5 w-5" />,
      },
      {
        title: "Pending Requests",
        href: "/dashboard/pending-requests",
        icon: <FileText className="h-5 w-5" />,
      },
    ]

    const adminItems = [
      {
        title: "Users",
        href: "/dashboard/users",
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: "Issuer Requests",
        href: "/dashboard/issuer-requests",
        icon: <UserCheck className="h-5 w-5" />,
      },
      {
        title: "Banned Users",
        href: "/dashboard/banned-users",
        icon: <ShieldCheck className="h-5 w-5" />,
      },
      {
        title: "Flagged Witnesses",
        href: "/dashboard/flagged-witnesses",
        icon: <Flag className="h-5 w-5" />,
      },
      {
        title: "Analytics",
        href: "/dashboard/analytics",
        icon: <BarChart3 className="h-5 w-5" />,
      },
    ]

    switch (userRole) {
      case "admin":
        return [...commonItems, ...adminItems]
      case "issuer":
        return [...commonItems, ...issuerItems]
      default:
        return [...commonItems, ...userItems]
    }
  }

  const items = getSidebarItems()

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-3">
        {isOpen && (
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">
              <span className="text-primary">Affid</span>
              <span className="text-secondary">Blocking</span>
            </span>
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto">
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                !isOpen && "justify-center px-0",
              )}
            >
              {item.icon}
              {isOpen && <span>{item.title}</span>}
              {!isOpen && <span className="sr-only">{item.title}</span>}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2", !isOpen && "justify-center px-0")}>
          <Home className="h-5 w-5 text-muted-foreground" />
          {isOpen && (
            <Link href="/" className="text-sm font-medium text-muted-foreground">
              Back to Home
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
