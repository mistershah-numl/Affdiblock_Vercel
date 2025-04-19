"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "Admin" | "Issuer" | "User"
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("ProtectedRoute check:", {
      isLoading,
      isAuthenticated,
      userRole: user?.role,
      requiredRole,
      page: window.location.pathname,
    })

    if (isLoading) return

    if (!isAuthenticated) {
      console.log("Redirecting to /login from", window.location.pathname)
      router.push("/login")
      return
    }

    if (requiredRole && user?.role !== requiredRole) {
      console.log(`Redirecting to /dashboard from ${window.location.pathname}, required role: ${requiredRole}`)
      router.push("/dashboard")
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}