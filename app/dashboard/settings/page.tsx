"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Mail, Globe, Wallet, Save } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast"
import { getWalletBalance, getNetworkName, getConnectedMetaMaskWallet } from "@/lib/blockchain"
import { ethers } from "ethers"

interface AccountSettings {
  email: string
  language: string
  timezone: string
  sessionTimeout: string
}

interface BlockchainSettings {
  walletAddress: string
  network: string
  balance: string
  walletConnectedAt: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, token, updateUser, isLoading: authLoading, isAuthenticated } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)
  const [isWalletMatched, setIsWalletMatched] = useState(false)

  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    email: "",
    language: "english",
    timezone: "UTC+0",
    sessionTimeout: "30",
  })

  const [blockchainSettings, setBlockchainSettings] = useState<BlockchainSettings>({
    walletAddress: "",
    network: "",
    balance: "0",
    walletConnectedAt: "",
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
    if (user) {
      setAccountSettings({
        email: user.email,
        language: user.language || "english",
        timezone: user.timezone || "UTC+0",
        sessionTimeout: user.sessionTimeout?.toString() || "30",
      })
      setBlockchainSettings({
        walletAddress: user.walletAddress || "",
        network: user.network || "",
        balance: "0",
        walletConnectedAt: user.walletConnectedAt ? new Date(user.walletConnectedAt).toLocaleString() : "",
      })
      checkWalletMatch()
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [user, authLoading, isAuthenticated, router])

  const checkWalletMatch = async () => {
    try {
      const metaMaskWallet = await getConnectedMetaMaskWallet()
      const isMatched = user?.walletAddress && metaMaskWallet && 
        metaMaskWallet.toLowerCase() === user.walletAddress.toLowerCase()
      setIsWalletMatched(!!isMatched)
      if (isMatched && user?.walletAddress) {
        const balance = await getWalletBalance(user.walletAddress)
        setBlockchainSettings((prev) => ({ ...prev, balance }))
      } else {
        setBlockchainSettings((prev) => ({ ...prev, balance: "0" }))
      }
    } catch (error) {
      console.error("Error checking wallet match:", error)
      setIsWalletMatched(false)
    }
  }

  const handleAccountsChanged = async (accounts: string[]) => {
    if (!user?.walletAddress) return

    const metaMaskWallet = accounts.length > 0 ? accounts[0] : null
    if (!metaMaskWallet && user.walletAddress) {
      await handleDisconnectWallet()
    } else {
      await checkWalletMatch()
    }
  }

  const fetchWalletBalance = async (walletAddress: string) => {
    try {
      const balance = await getWalletBalance(walletAddress)
      setBlockchainSettings((prev) => ({ ...prev, balance }))
    } catch (error) {
      console.error("Error fetching balance:", error)
      toast({
        title: "Error",
        description: "Failed to fetch wallet balance",
        variant: "destructive",
      })
    }
  }

  const handleAccountSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setAccountSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "Error",
        description: "MetaMask is not installed. Please install the MetaMask extension.",
        variant: "destructive",
      })
      return
    }

    setIsConnectingWallet(true)
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from MetaMask")
      }
      const walletAddress = accounts[0]
      const network = await getNetworkName()
      const balance = await getWalletBalance(walletAddress)

      const response = await fetch("/api/user/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ walletAddress, network }),
      })
      const data = await response.json()

      if (data.success) {
        const updatedUser = {
          ...user,
          walletAddress,
          walletConnectedAt: new Date().toISOString(),
          network,
        }
        updateUser(updatedUser)
        setBlockchainSettings({
          walletAddress,
          network,
          balance,
          walletConnectedAt: new Date().toLocaleString(),
        })
        setIsWalletMatched(true)
        toast({
          title: "Wallet Connected",
          description: "Your MetaMask wallet has been connected successfully.",
          className: "bg-green-100 border-green-500",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to connect wallet",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      if (error.code === 4001 || error.message?.toLowerCase().includes("reject")) {
        toast({
          title: "Connection Rejected",
          description: "Wallet connection request was rejected.",
          variant: "destructive",
        })
      } else {
        console.error("Error connecting wallet:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to connect MetaMask wallet",
          variant: "destructive",
        })
      }
    } finally {
      setIsConnectingWallet(false)
    }
  }

  const handleDisconnectWallet = async () => {
    setIsConnectingWallet(true)
    try {
      const response = await fetch("/api/user/wallet", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (data.success) {
        const updatedUser = {
          ...user,
          walletAddress: null,
          walletConnectedAt: null,
          network: null,
        }
        updateUser(updatedUser)
        setBlockchainSettings({
          walletAddress: "",
          network: "",
          balance: "0",
          walletConnectedAt: "",
        })
        setIsWalletMatched(false)
        toast({
          title: "Wallet Disconnected",
          description: "Your wallet has been disconnected successfully.",
          className: "bg-green-100 border-green-500",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to disconnect wallet",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsConnectingWallet(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          language: accountSettings.language,
          timezone: accountSettings.timezone,
          sessionTimeout: accountSettings.sessionTimeout,
        }),
      })
      const data = await response.json()

      if (data.success) {
        updateUser(data.user)
        toast({
          title: "Settings Saved",
          description: "Your account settings have been updated successfully.",
          className: "bg-green-100 border-green-500",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    toast({
      title: "Debug",
      description: "Toast rendering test",
      variant: "default",
    })
  }, [])

  if (authLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500">Manage your account settings and wallet</p>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
        </TabsList>

        {/* Account Settings Tab */}
        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    name="email"
                    value={accountSettings.email}
                    onChange={handleAccountSettingChange}
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500">To change your email, please contact support</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <select
                    id="language"
                    name="language"
                    value={accountSettings.language}
                    onChange={handleAccountSettingChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="chinese">Chinese</option>
                    <option value="arabic">Arabic</option>
                    <option value="urdu">Urdu</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <select
                    id="timezone"
                    name="timezone"
                    value={accountSettings.timezone}
                    onChange={handleAccountSettingChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="UTC-12">UTC-12:00</option>
                    <option value="UTC-11">UTC-11:00</option>
                    <option value="UTC-10">UTC-10:00</option>
                    <option value="UTC-9">UTC-09:00</option>
                    <option value="UTC-8">UTC-08:00</option>
                    <option value="UTC-7">UTC-07:00</option>
                    <option value="UTC-6">UTC-06:00</option>
                    <option value="UTC-5">UTC-05:00</option>
                    <option value="UTC-4">UTC-04:00</option>
                    <option value="UTC-3">UTC-03:00</option>
                    <option value="UTC-2">UTC-02:00</option>
                    <option value="UTC-1">UTC-01:00</option>
                    <option value="UTC+0">UTC+00:00</option>
                    <option value="UTC+1">UTC+01:00</option>
                    <option value="UTC+2">UTC+02:00</option>
                    <option value="UTC+3">UTC+03:00</option>
                    <option value="UTC+4">UTC+04:00</option>
                    <option value="UTC+5">UTC+05:00</option>
                    <option value="UTC+5:30">UTC+05:30</option>
                    <option value="UTC+6">UTC+06:00</option>
                    <option value="UTC+7">UTC+07:00</option>
                    <option value="UTC+8">UTC+08:00</option>
                    <option value="UTC+9">UTC+09:00</option>
                    <option value="UTC+10">UTC+10:00</option>
                    <option value="UTC+11">UTC+11:00</option>
                    <option value="UTC+12">UTC+12:00</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <select
                    id="sessionTimeout"
                    name="sessionTimeout"
                    value={accountSettings.sessionTimeout}
                    onChange={handleAccountSettingChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="240">4 hours</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500">Automatically log out after a period of inactivity</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Blockchain Settings Tab */}
        <TabsContent value="blockchain" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Settings</CardTitle>
              <CardDescription>Manage your blockchain wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="walletAddress">Wallet Address</Label>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-gray-500" />
                  <Input
                    id="walletAddress"
                    name="walletAddress"
                    value={isWalletMatched ? blockchainSettings.walletAddress : ""}
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {isWalletMatched && blockchainSettings.walletAddress
                    ? `Connected on ${blockchainSettings.walletConnectedAt}`
                    : "No wallet connected"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="network">Network</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <Input id="network" name="network" value={isWalletMatched ? blockchainSettings.network : ""} disabled />
                </div>
                <p className="text-xs text-gray-500">The blockchain network your wallet is connected to</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="balance">Balance</Label>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-gray-500" />
                  <Input
                    id="balance"
                    name="balance"
                    value={isWalletMatched ? `${blockchainSettings.balance} ETH` : "0 ETH"}
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500">Your wallet's current balance</p>
              </div>

              <div className="pt-4">
                {isWalletMatched ? (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDisconnectWallet}
                    disabled={isConnectingWallet}
                  >
                    {isConnectingWallet ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wallet className="mr-2 h-4 w-4" />
                    )}
                    Disconnect Wallet
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleConnectWallet}
                    disabled={isConnectingWallet}
                  >
                    {isConnectingWallet ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wallet className="mr-2 h-4 w-4" />
                    )}
                    Connect Wallet
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}