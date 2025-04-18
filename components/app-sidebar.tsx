"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutDashboard, FileText, Settings, Users, Shield, LogOut, FileCheck } from "lucide-react"

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

  // Set mounted state when component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (path: string) => pathname === path

  // Only render sidebar for logged-in users and dashboard paths
  if (!mounted || !isAuthenticated || !pathname?.startsWith("/dashboard")) {
    return null
  }

  // Define sidebar items based on user role
  const getUserMenuItems = () => {
    const commonItems = [
      {
        icon: <Home />,
        label: "Home",
        href: "/",
      },
      {
        icon: <LayoutDashboard />,
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        icon: <FileText />,
        label: "My Affidavits",
        href: "/dashboard/affidavits",
      },
      {
        icon: <Users />,
        label: "Profile",
        href: "/dashboard/profile",
      },
      {
        icon: <Settings />,
        label: "Settings",
        href: "/dashboard/settings",
      },
    ]

    // Admin-specific items
    if (user?.role === "Admin") {
      return [
        ...commonItems,
        {
          icon: <Users />,
          label: "Users Management",
          href: "/dashboard/users",
        },
        {
          icon: <Shield />,
          label: "Issuer Requests",
          href: "/dashboard/issuer-requests",
        },
      ]
    }

    // Issuer-specific items
    if (user?.role === "Issuer") {
      return [
        ...commonItems,
        {
          icon: <FileCheck />,
          label: "Issued Affidavits",
          href: "/dashboard/issued-affidavits",
        },
      ]
    }

    // Default items for regular users
    return commonItems
  }

  const menuItems = getUserMenuItems()

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between">
        {open && (
          <div className="flex items-center gap-2 px-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">AffidBlock</span>
          </div>
        )}
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={() => logout()}>
                  <button className="w-full flex items-center">
                    <LogOut />
                    <span>Logout</span>
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
