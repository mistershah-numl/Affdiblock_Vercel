"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  Shield,
  LogOut,
  FileCheck,
  Flag,
  UserCheck,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils" // Add this import

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"

export function AppSidebar() {
  const pathname = usePathname()
  const { open } = useSidebar()
  const { isAuthenticated, user, logout } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (path: string) => pathname === path

  if (!mounted || !isAuthenticated || !pathname?.startsWith("/dashboard")) {
    return null
  }

  const getUserMenuItems = () => {
    const commonItems = [
      {
        icon: <Home className="h-5 w-5" />,
        label: "Home",
        href: "/",
      },
      {
        icon: <LayoutDashboard className="h-5 w-5" />,
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        icon: <Users className="h-5 w-5" />,
        label: "Profile",
        href: "/dashboard/profile",
      },
      {
        icon: <Settings className="h-5 w-5" />,
        label: "Settings",
        href: "/dashboard/settings",
      },
      {
        icon: <AlertCircle className="h-5 w-5" />,
        label: "Support",
        href: "/dashboard/support",
      },
    ]

    const userItems = [
      {
        icon: <FileText className="h-5 w-5" />,
        label: "My Affidavits",
        href: "/dashboard/affidavits",
      },
    ]

    const issuerItems = [
      {
        icon: <FileText className="h-5 w-5" />,
        label: "Affidavit Requests",
        href: "/dashboard/affidavits",
      },
      {
        icon: <FileCheck className="h-5 w-5" />,
        label: "Issued Affidavits",
        href: "/dashboard/issued-affidavits",
      },
      {
        icon: <Flag className="h-5 w-5" />,
        label: "Flagged Witnesses",
        href: "/dashboard/flagged-witnesses",
      },
    ]

    const adminItems = [
      {
        icon: <FileText className="h-5 w-5" />,
        label: "All Affidavits",
        href: "/dashboard/all-affidavits",
      },
      {
        icon: <Users className="h-5 w-5" />,
        label: "User Management",
        href: "/dashboard/users",
      },
      {
        icon: <UserCheck className="h-5 w-5" />,
        label: "Create User",
        href: "/dashboard/users/new",
      },
      {
        icon: <Shield className="h-5 w-5" />,
        label: "Issuer Requests",
        href: "/dashboard/issuer-requests",
      },
      {
        icon: <Flag className="h-5 w-5" />,
        label: "Flagged Witnesses",
        href: "/dashboard/flagged-witnesses",
      },
      {
        icon: <Users className="h-5 w-5" />,
        label: "Banned Users",
        href: "/dashboard/banned-users",
      },
    ]

    switch (user?.activeRole) {
      case "Admin":
        return [...commonItems, ...adminItems]
      case "Issuer":
        return [...commonItems, ...issuerItems]
      default:
        return [...commonItems, ...userItems]
    }
  }

  const menuItems = getUserMenuItems()

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="flex items-center h-14 border-b px-2">
        {open && (
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">AffidBlock</span>
          </div>
        )}
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      !open && "justify-center px-0",
                    )}
                  >
                    <Link href={item.href}>
                      {item.icon}
                      {open && <span className="ml-3">{item.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground",
                    !open && "justify-center px-0",
                  )}
                >
                  <button onClick={() => logout()} className="w-full flex items-center">
                    <LogOut className="h-5 w-5" />
                    {open && <span className="ml-3">Logout</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}