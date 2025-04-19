"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "@/components/ui/use-toast"

interface User {
  _id: string
  name: string
  email: string
  role: string
  status: string
  phone?: string
  idCardNumber: string
  idCardFrontUrl: string
  idCardBackUrl: string
  address?: string
  bio?: string
  walletAddress?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (formData: FormData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (user: User) => void
  verifyTokenClientSide: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user")
        const storedToken = Cookies.get("token")

        console.log("Initializing auth:", { storedUser: !!storedUser, storedToken: !!storedToken })

        if (!storedToken || !storedUser) {
          console.log("No token or user found, setting unauthenticated")
          setIsAuthenticated(false)
          setUser(null)
          setToken(null)
          setIsLoading(false)
          return
        }

        let parsedUser: User
        try {
          parsedUser = JSON.parse(storedUser)
        } catch (error) {
          console.error("Error parsing stored user:", error)
          setIsAuthenticated(false)
          setUser(null)
          setToken(null)
          localStorage.removeItem("user")
          Cookies.remove("token", { path: "/" })
          setIsLoading(false)
          return
        }

        // Optimistically set auth state to reduce flicker
        setUser(parsedUser)
        setToken(storedToken)
        setIsAuthenticated(true)

        const response = await fetch("/api/auth/verify", {
          headers: { Authorization: `Bearer ${storedToken}` },
        })

        if (response.ok) {
          console.log("Token verified successfully")
        } else {
          const errorData = await response.json()
          console.log("Server-side token verification failed:", errorData)
          toast({
            title: "Session Expired",
            description: "Please log in again.",
            variant: "destructive",
          })
          setUser(null)
          setToken(null)
          setIsAuthenticated(false)
          localStorage.removeItem("user")
          Cookies.remove("token", { path: "/" })
          router.push("/login")
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        toast({
          title: "Authentication Error",
          description: "Failed to verify session. Please log in again.",
          variant: "destructive",
        })
        setUser(null)
        setToken(null)
        setIsAuthenticated(false)
        localStorage.removeItem("user")
        Cookies.remove("token", { path: "/" })
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [router])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (data.success) {
        setUser(data.user)
        setToken(data.token)
        setIsAuthenticated(true)
        localStorage.setItem("user", JSON.stringify(data.user))
        Cookies.set("token", data.token, { expires: 7, path: "/", secure: true, sameSite: "strict" })
        router.push("/dashboard")
        return { success: true }
      } else {
        return { success: false, error: data.error || "Login failed" }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      return { success: false, error: error.message || "An unexpected error occurred" }
    }
  }

  const register = async (formData: FormData) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
    localStorage.removeItem("user")
    Cookies.remove("token", { path: "/" })
    router.push("/login")
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
  }

  const verifyTokenClientSide = () => {
    return !!token
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, isLoading, login, register, logout, updateUser, verifyTokenClientSide }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}