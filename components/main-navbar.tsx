"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MenuIcon, Shield, User, X, Bell } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"

export function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout, switchRole } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Features", href: "/features" },
    { name: "Verify", href: "/verify" },
    { name: "Documentation", href: "/docs" },
  ]

  const isDashboardPath = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")

  const handleLogin = () => {
    router.push("/login")
  }

  const handleRegister = () => {
    router.push("/register")
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleDashboard = () => {
    router.push("/dashboard")
  }

  const handleRequestIssuerRole = () => {
    router.push("/dashboard/request-issuer")
  }

  const handleRequestAdminRole = () => {
    router.push("/dashboard/request-admin")
  }

  const handleRequestUserRole = () => {
    router.push("/dashboard/request-user")
  }

  // Define all possible roles
  const allRoles = ["User", "Issuer", "Admin"]

  // Generate role-related menu items dynamically
  const getRoleMenuItems = () => {
    if (!user || !user.roles) return []

    const menuItems: { label: string; onClick: () => void }[] = []

    allRoles.forEach((role) => {
      if (role === user.activeRole) return // Skip the current active role

      if (user.roles.includes(role)) {
        // User has this role, show "Switch to [Role]"
        menuItems.push({
          label: `Switch to ${role}`,
          onClick: () => switchRole(role),
        })
      } else {
        // User does not have this role, show "Become a [Role]"
        if (role === "User") {
          menuItems.push({
            label: "Become a User",
            onClick: handleRequestUserRole,
          })
        } else if (role === "Issuer") {
          menuItems.push({
            label: "Become an Issuer",
            onClick: handleRequestIssuerRole,
          })
        } else if (role === "Admin") {
          menuItems.push({
            label: "Become an Admin",
            onClick: handleRequestAdminRole,
          })
        }
      }
    })

    return menuItems
  }

  if (!mounted) {
    return null
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        isScrolled ? "shadow-sm" : "",
      )}
    >
      <div className="container flex h-16 items-center px-4">
        {isAuthenticated && <SidebarTrigger className="mr-2" />}

        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">AffidBlock</span>
        </Link>

        {!isDashboardPath && (
          <nav className="mx-6 hidden md:flex items-center space-x-4 lg:space-x-6 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href ? "text-primary" : "text-muted-foreground",
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        )}

        {!isDashboardPath && (
          <div className="md:hidden flex-1 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </Button>
          </div>
        )}

        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      3
                    </span>
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">{user.activeRole}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDashboard}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {getRoleMenuItems().map((item, index) => (
                    <DropdownMenuItem key={index} onClick={item.onClick}>
                      <User className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex gap-2">
              <Button variant="ghost" onClick={handleLogin}>
                Login
              </Button>
              <Button onClick={handleRegister}>Sign Up</Button>
            </div>
          )}
        </div>
      </div>

      {!isDashboardPath && isMenuOpen && (
        <div className="md:hidden border-t py-4 px-6 bg-background">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href ? "text-primary" : "text-muted-foreground",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="pt-4 border-t flex flex-col gap-2">
                <Button variant="outline" className="w-full" onClick={handleLogin}>
                  Login
                </Button>
                <Button className="w-full" onClick={handleRegister}>
                  Sign Up
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}