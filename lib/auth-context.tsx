"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { jwtDecode } from "jwt-decode"

interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  idCardNumber?: string
  idCardFrontUrl?: string
  idCardBackUrl?: string
  address?: string
  bio?: string
  walletAddress?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

interface AuthContextProps {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (formData: FormData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  verifyTokenClientSide: () => boolean
  updateUser: (updatedUser: Partial<User>) => void
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token") || Cookies.get("token")

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      setToken(storedToken)
      setIsAuthenticated(verifyTokenClientSide())
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      console.log("Sending login request with:", { email })

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("Login API response status:", response.status)
      const data = await response.json()
      console.log("Login API response:", data)

      if (!data.success) {
        console.log("Login failed:", data.error)
        return { success: false, error: data.error || "Login failed" }
      }

      setUser(data.user)
      setToken(data.token)
      setIsAuthenticated(true)

      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("token", data.token)

      Cookies.set("token", data.token, { expires: 7, path: "/", secure: true, sameSite: "strict" })
      console.log("Token set in cookies:", data.token)

      await new Promise((resolve) => setTimeout(resolve, 100))

      return { success: true }
    } catch (error) {
      console.error("Login error in AuthContext:", error)
      return { success: false, error: "An unexpected error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (formData: FormData) => {
    try {
      setIsLoading(true)
      console.log("Sending registration request")

      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      })

      console.log("Register API response status:", response.status)
      const data = await response.json()
      console.log("Register API response:", data)

      if (!data.success) {
        console.log("Registration failed:", data.error)
        return { success: false, error: data.error || "Registration failed" }
      }

      return { success: true }
    } catch (error) {
      console.error("Registration error in AuthContext:", error)
      return { success: false, error: "An unexpected error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)

    localStorage.removeItem("user")
    localStorage.removeItem("token")
    Cookies.remove("token", { path: "/" })

    router.push("/login")
  }

  const verifyTokenClientSide = () => {
    if (!token) return false

    try {
      const decoded: { exp: number } = jwtDecode(token)
      const currentTime = Math.floor(Date.now() / 1000)
      if (decoded.exp < currentTime) {
        console.log("Token expired")
        return false
      }
      console.log("Token is valid (client-side)")
      return true
    } catch (error) {
      console.error("Client-side token verification failed:", error)
      return false
    }
  }

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser }
      setUser(newUser)
      localStorage.setItem("user", JSON.stringify(newUser))
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, isLoading, login, register, logout, verifyTokenClientSide, updateUser }}
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