"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { MainNavbar } from "@/components/main-navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggleFloating } from "@/components/theme-toggle-floating"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex flex-col w-full">
        <MainNavbar />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 p-4 overflow-auto">{children}</main>
        </div>
      </div>
      <ThemeToggleFloating />
    </div>
  )
}