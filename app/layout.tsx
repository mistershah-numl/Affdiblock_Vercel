import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { MainNavbar } from "@/components/main-navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AffidBlock - Blockchain Based Stamp Issuer And Verification",
  description: "Secure, tamper-proof affidavit and stamp paper verification system using blockchain technology",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <SidebarProvider>
              <div className="flex min-h-screen flex-col w-full">
                <MainNavbar />
                <div className="flex flex-1 w-full">
                  <AppSidebar />
                  <main className="flex-1 w-full p-6 overflow-y-auto transition-all duration-300 ease-in-out">
                    {children}
                  </main>
                </div>
              </div>
              <Toaster />
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}