"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  FileText,
  Settings,
  Users,
  Shield,
  Bell,
  HelpCircle,
  FileCheck,
  UserPlus,
  Ban,
  AlertTriangle,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ThemeToggleFloating } from "@/components/theme-toggle-floating"
import IssuerApplicationDialog from "@/components/issuer-application-dialog"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isIssuerDialogOpen, setIsIssuerDialogOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Mock user data - in a real app, this would come from authentication
  // Changed to useState to allow for role switching in the demo
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    role: "User", // Could be "Admin", "Issuer", or "User"
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "JD",
    walletAddress: "0x1234...5678",
  })

  // Ensure component is mounted before rendering to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)

    // Check for role in localStorage (for demo purposes)
    const storedRole = localStorage.getItem("userRole")
    if (storedRole) {
      setUser((prev) => ({ ...prev, role: storedRole }))
    }

    // Check for sidebar state in localStorage
    const sidebarState = localStorage.getItem("sidebarState")
    if (sidebarState) {
      setIsSidebarOpen(sidebarState === "open")
    }

    // Handle resize events to collapse sidebar on small screens
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize() // Check on initial load

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Toggle sidebar and save state to localStorage
  const toggleSidebar = () => {
    const newState = !isSidebarOpen
    setIsSidebarOpen(newState)
    localStorage.setItem("sidebarState", newState ? "open" : "closed")
  }

  // Role-based navigation items
  const userNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "My Affidavits", href: "/dashboard/affidavits", icon: FileText },
    { name: "Profile", href: "/dashboard/profile", icon: Users },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Support", href: "/support", icon: HelpCircle },
  ]

  const issuerNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "Affidavit Requests", href: "/dashboard/affidavits", icon: FileText },
    { name: "Issued Affidavits", href: "/dashboard/issued-affidavits", icon: FileCheck },
    { name: "Flagged Witnesses", href: "/dashboard/flagged-witnesses", icon: AlertTriangle },
    { name: "Profile", href: "/dashboard/profile", icon: Users },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Support", href: "/support", icon: HelpCircle },
  ]

  const adminNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "All Affidavits", href: "/dashboard/affidavits", icon: FileText },
    { name: "Users Management", href: "/dashboard/users", icon: Users },
    { name: "Create User", href: "/dashboard/users/new", icon: UserPlus },
    { name: "Issuer Requests", href: "/dashboard/issuer-requests", icon: Shield },
    { name: "Flagged Witnesses", href: "/dashboard/flagged-witnesses", icon: AlertTriangle },
    { name: "Banned Users", href: "/dashboard/banned-users", icon: Ban },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Support", href: "/support", icon: HelpCircle },
  ]

  // Select navigation based on user role
  const navigation =
    user.role === "Admin" ? adminNavigation : user.role === "Issuer" ? issuerNavigation : userNavigation

  // Function to switch roles (for demo purposes)
  const switchRole = (newRole: string) => {
    setUser((prev) => ({ ...prev, role: newRole }))
    localStorage.setItem("userRole", newRole)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:w-20",
        )}
      >
        {/* Sidebar header with logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center">
            {isSidebarOpen ? (
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                AffidBlock
              </span>
            ) : (
              <span className="text-xl font-bold">AB</span>
            )}
          </Link>
        </div>

        {/* Sidebar content */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      !isSidebarOpen && "justify-center px-0",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isSidebarOpen && "mr-3")} />
                    {isSidebarOpen && <span>{item.name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Role switcher for demo */}
          {isSidebarOpen && (
            <div className="mt-8 space-y-2">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground">Demo: Switch Role</h3>
              <div className="grid grid-cols-3 gap-2 px-3">
                <Button
                  variant={user.role === "User" ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchRole("User")}
                  className="w-full"
                >
                  User
                </Button>
                <Button
                  variant={user.role === "Issuer" ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchRole("Issuer")}
                  className="w-full"
                >
                  Issuer
                </Button>
                <Button
                  variant={user.role === "Admin" ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchRole("Admin")}
                  className="w-full"
                >
                  Admin
                </Button>
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <header className="sticky top-0 z-40 border-b bg-card">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              {/* Sidebar toggle */}
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2" aria-label="Toggle sidebar">
                <Menu className="h-5 w-5" />
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5 opacity-0" />}
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    <div className="p-3 hover:bg-muted cursor-pointer">
                      <p className="text-sm font-medium">New affidavit request</p>
                      <p className="text-xs text-muted-foreground">John Doe requested a new affidavit</p>
                      <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
                    </div>
                    <div className="p-3 hover:bg-muted cursor-pointer">
                      <p className="text-sm font-medium">Affidavit approved</p>
                      <p className="text-xs text-muted-foreground">Your affidavit has been approved</p>
                      <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2 text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      View all notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex md:flex-col md:items-start">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.role}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => (window.location.href = "/dashboard/profile")}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => (window.location.href = "/dashboard/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  {user.role === "User" && (
                    <DropdownMenuItem onClick={() => setIsIssuerDialogOpen(true)}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Become an Issuer</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => (window.location.href = "/login")}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Mobile navigation menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b bg-card">
            <nav className="p-4">
              <ul className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">{children}</main>
      </div>

      {/* Floating theme toggle */}
      <ThemeToggleFloating />

      {/* Issuer Application Dialog */}
      <IssuerApplicationDialog open={isIssuerDialogOpen} onOpenChange={setIsIssuerDialogOpen} />
    </div>
  )
}
