"use client"

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  idCardNumber?: string;
  address?: string;
  bio?: string;
  walletAddress?: string;
  walletConnectedAt?: string;
  network?: string;
  language: string;
  timezone: string;
  sessionTimeout: number;
  avatar?: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  status: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: ( Linda: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = Cookies.get("token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(data.user));
        Cookies.set("token", data.token, { expires: 7, secure: true, sameSite: "strict" });
        router.push("/dashboard");
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    console.log("Logging out user:", user?.email);
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    Cookies.remove("token", { path: "/" });
    router.push("/login");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}