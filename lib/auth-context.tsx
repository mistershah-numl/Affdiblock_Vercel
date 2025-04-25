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
  roles: string[];
  activeRole: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  switchRole: (role: string) => void;
  register: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
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
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = Cookies.get("token");
        const storedActiveRole = localStorage.getItem("activeRole");

        if (storedUser && storedToken) {
          const parsedUser: User = JSON.parse(storedUser);

          // Validate that parsedUser has roles and it’s an array
          if (!parsedUser.roles || !Array.isArray(parsedUser.roles)) {
            // If roles is missing or invalid, clear storage and treat as logged out
            localStorage.removeItem("user");
            localStorage.removeItem("activeRole");
            Cookies.remove("token", { path: "/" });
            setIsAuthenticated(false);
            return;
          }

          setUser(parsedUser);
          setToken(storedToken);
          setIsAuthenticated(true);

          // Update activeRole if storedActiveRole is valid
          if (storedActiveRole && parsedUser.roles.includes(storedActiveRole)) {
            parsedUser.activeRole = storedActiveRole;
            localStorage.setItem("activeRole", storedActiveRole);
            localStorage.setItem("user", JSON.stringify(parsedUser));
          }
        }
      } catch (error) {
        // If there’s an error (e.g., JSON.parse fails or roles is undefined), clear storage
        localStorage.removeItem("user");
        localStorage.removeItem("activeRole");
        Cookies.remove("token", { path: "/" });
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.success) {
        // Validate that the user object has roles before saving
        if (!data.user.roles || !Array.isArray(data.user.roles)) {
          return { success: false, error: "Invalid user data: roles missing or invalid" };
        }

        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("activeRole", data.user.activeRole);
        Cookies.set("token", data.token, { expires: 7, secure: true, sameSite: "strict" });
        router.push("/dashboard");
        return { success: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      return { success: false, error: "An unexpected error occurred during login" };
    }
  };

  const register = async (formData: FormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error || "Registration failed" };
      }
    } catch (error) {
      return { success: false, error: "An unexpected error occurred during registration" };
    }
  };

  const logout = () => {
    console.log("Logging out user:", user?.email);
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    localStorage.removeItem("activeRole");
    Cookies.remove("token", { path: "/" });
    router.push("/login");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    localStorage.setItem("activeRole", updatedUser.activeRole);
  };

  const switchRole = (role: string) => {
    if (!user || !user.roles.includes(role)) {
      console.error(`User does not have access to role: ${role}`);
      return;
    }
    const updatedUser = { ...user, activeRole: role };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    localStorage.setItem("activeRole", role);
    router.push("/dashboard");
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout, updateUser, switchRole, register }}>
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