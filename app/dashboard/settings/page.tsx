"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Globe, Wallet, Save } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/use-toast";
import {
  getWalletBalance,
  getNetworkName,
  getConnectedMetaMaskWallet,
} from "@/lib/blockchain";
import { ethers } from "ethers";

// Network map to match chain IDs (consistent with API route)
const NETWORK_MAP: { [key: string]: string } = {
  "1337": "ganache",
  "11155111": "sepolia",
  "1": "mainnet",
  "5": "goerli",
};

interface AccountSettings {
  email: string;
  language: string;
  timezone: string;
  sessionTimeout: string;
}

interface BlockchainSettings { // alina -> all about wallets connectin and disconnection
  walletAddress: string;
  network: string;
  balance: string;
  walletConnectedAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, updateUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [isWalletMatched, setIsWalletMatched] = useState(false);
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]); // Track wallets permitted by MetaMask

  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    email: "",
    language: "english",
    timezone: "UTC+0",
    sessionTimeout: "30",
  });

  const [blockchainSettings, setBlockchainSettings] = useState<BlockchainSettings>({
    walletAddress: "",
    network: "",
    balance: "0",
    walletConnectedAt: "",
  });

  const checkWalletMatch = useCallback(async () => {
    let isChecking = false;
    if (isChecking) return;

    isChecking = true;
    try {
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        if (user?.walletAddress) {
          await handleDisconnectWallet();
        }
        setIsWalletMatched(false);
        setBlockchainSettings((prev) => ({ ...prev, balance: "0", network: "Not connected" }));
        return;
      }

      const metaMaskWallet = await getConnectedMetaMaskWallet();
      const isMatched =
        user?.walletAddress && metaMaskWallet && metaMaskWallet.toLowerCase() === user.walletAddress.toLowerCase();
      setIsWalletMatched(!!isMatched);

      if (!isMatched && user?.walletAddress) {
        await handleDisconnectWallet();
        return;
      }

      if (isMatched && user?.walletAddress) {
        const balance = await getWalletBalance(user.walletAddress);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const chainId = network.chainId.toString();
        const networkName = NETWORK_MAP[chainId] || "unknown";
        setBlockchainSettings((prev) => ({
          ...prev,
          balance,
          network: networkName,
          walletConnectedAt: new Date().toLocaleString(),
        }));
      } else {
        setBlockchainSettings((prev) => ({ ...prev, balance: "0", network: "Not connected" }));
      }
    } catch (error: any) {
      console.error("Error checking wallet match:", error);
      setIsWalletMatched(false);
      setBlockchainSettings((prev) => ({ ...prev, balance: "0", network: "Not connected" }));
      if (error.code === -32002) {
        toast({
          title: "Notice",
          description: "A wallet request is already pending. Please wait or try again.",
          variant: "default",
        });
      } else if (error.message.includes("MetaMask is not installed")) {
        toast({
          title: "Notice",
          description: "MetaMask is not detected. Please install or connect it.",
          variant: "default",
        });
      }
    } finally {
      isChecking = false;
    }
  }, [user?.walletAddress]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
    if (user) {
      setAccountSettings({
        email: user.email,
        language: user.language || "english",
        timezone: user.timezone || "UTC+0",
        sessionTimeout: user.sessionTimeout?.toString() || "30",
      });
      setBlockchainSettings({
        walletAddress: user.walletAddress || "",
        network: user.network || "",
        balance: "0",
        walletConnectedAt: user.walletConnectedAt ? new Date(user.walletConnectedAt).toLocaleString() : "",
      });
      checkWalletMatch();
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", checkWalletMatch);

      // Initialize connected wallets
      window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        setConnectedWallets(accounts.map((addr: string) => addr.toLowerCase()));
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", checkWalletMatch);
      }
    };
  }, [user, authLoading, isAuthenticated, router, checkWalletMatch]);

  const handleAccountsChanged = async (accounts: string[]) => {
    const metaMaskWallet = accounts.length > 0 ? accounts[0] : null;
    setConnectedWallets(accounts.map((addr: string) => addr.toLowerCase()));
    if (!metaMaskWallet) {
      await handleDisconnectWallet();
    } else {
      if (user?.walletAddress && metaMaskWallet.toLowerCase() !== user.walletAddress.toLowerCase()) {
        await handleDisconnectWallet();
      }
      await checkWalletMatch();
    }
  };

  const fetchWalletBalance = async (walletAddress: string) => {
    try {
      const balance = await getWalletBalance(walletAddress);
      setBlockchainSettings((prev) => ({ ...prev, balance }));
    } catch (error: any) {
      console.error("Error fetching balance:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch wallet balance",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isWalletMatched && user?.walletAddress) {
      fetchWalletBalance(user.walletAddress);
      intervalId = setInterval(() => fetchWalletBalance(user.walletAddress), 30000); // Refresh every 30s
    }
    return () => clearInterval(intervalId);
  }, [isWalletMatched, user?.walletAddress]);

  const handleAccountSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAccountSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleConnectWallet = async () => {
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      toast({
        title: "Notice",
        description: "MetaMask is not detected. Please install or connect the MetaMask extension.",
        variant: "default",
      });
      return;
    }

    setIsConnectingWallet(true);
    try {
      const currentAccounts = await window.ethereum.request({ method: "eth_accounts" });
      const currentWallet = currentAccounts[0]?.toLowerCase();

      if (!currentWallet) {
        // No accounts available, prompt for connection
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts returned from MetaMask");
        }
        const walletAddress = accounts[0].toLowerCase();
        setConnectedWallets((prev) => [...prev, walletAddress]);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const chainId = network.chainId.toString();
        const balance = await getWalletBalance(walletAddress);
        const networkName = NETWORK_MAP[chainId] || "unknown";

        const response = await fetch("/api/user/wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ walletAddress, chainId }),
        });
        const data = await response.json();

        if (data.success) {
          const updatedUser = {
            ...user,
            walletAddress,
            walletConnectedAt: new Date().toISOString(),
            network: networkName,
          };
          updateUser(updatedUser);
          setBlockchainSettings({
            walletAddress,
            network: networkName,
            balance,
            walletConnectedAt: new Date().toLocaleString(),
          });
          setIsWalletMatched(true);
          toast({
            title: "Success",
            description: "Your MetaMask wallet has been connected successfully.",
            className: "bg-green-100 border-green-500",
          });
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to connect wallet",
            variant: "destructive",
          });
        }
      } else {
        // Check if the current wallet matches the previously connected wallet
        const isPreviouslyConnected = user?.walletAddress === currentWallet;
        if (isPreviouslyConnected && connectedWallets.includes(currentWallet)) {
          // Reconnect the previously connected wallet without a popup
          const walletAddress = currentWallet;
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          const chainId = network.chainId.toString();
          const balance = await getWalletBalance(walletAddress);
          const networkName = NETWORK_MAP[chainId] || "unknown";

          const response = await fetch("/api/user/wallet", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ walletAddress, chainId }),
          });
          const data = await response.json();

          if (data.success) {
            const updatedUser = {
              ...user,
              walletAddress,
              walletConnectedAt: new Date().toISOString(),
              network: networkName,
            };
            updateUser(updatedUser);
            setBlockchainSettings({
              walletAddress,
              network: networkName,
              balance,
              walletConnectedAt: new Date().toLocaleString(),
            });
            setIsWalletMatched(true);
            toast({
              title: "Success",
              description: "Your MetaMask wallet has been reconnected successfully.",
              className: "bg-green-100 border-green-500",
            });
          } else {
            toast({
              title: "Error",
              description: data.error || "Failed to reconnect wallet",
              variant: "destructive",
            });
          }
        } else {
          // Prompt for the new wallet
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          if (!accounts || accounts.length === 0) {
            throw new Error("No accounts returned from MetaMask");
          }
          const walletAddress = accounts[0].toLowerCase();
          setConnectedWallets((prev) => [...prev, walletAddress]);

          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          const chainId = network.chainId.toString();
          const balance = await getWalletBalance(walletAddress);
          const networkName = NETWORK_MAP[chainId] || "unknown";

          const response = await fetch("/api/user/wallet", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ walletAddress, chainId }),
          });
          const data = await response.json();

          if (data.success) {
            const updatedUser = {
              ...user,
              walletAddress,
              walletConnectedAt: new Date().toISOString(),
              network: networkName,
            };
            updateUser(updatedUser);
            setBlockchainSettings({
              walletAddress,
              network: networkName,
              balance,
              walletConnectedAt: new Date().toLocaleString(),
            });
            setIsWalletMatched(true);
            toast({
              title: "Success",
              description: "Your MetaMask wallet has been connected successfully.",
              className: "bg-green-100 border-green-500",
            });
          } else {
            toast({
              title: "Error",
              description: data.error || "Failed to connect wallet",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error: any) {
      if (error.code === -32002) {
        toast({
          title: "Notice",
          description: "A wallet request is already pending. Please wait or try again.",
          variant: "default",
        });
      } else if (error.code === 4001 || error.message?.toLowerCase().includes("reject")) {
        toast({
          title: "Notice",
          description: "Wallet connection request was rejected.",
          variant: "default",
        });
      } else {
        console.error("Error connecting wallet:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to connect MetaMask wallet",
          variant: "destructive",
        });
      }
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleDisconnectWallet = async () => {
    setIsConnectingWallet(true);
    try {
      const response = await fetch("/api/user/wallet", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const updatedUser = {
          ...user,
          walletAddress: null,
          walletConnectedAt: null,
          network: null,
        };
        updateUser(updatedUser);
        setBlockchainSettings({
          walletAddress: "",
          network: "",
          balance: "0",
          walletConnectedAt: "",
        });
        setIsWalletMatched(false);

        // Remove the disconnected wallet from connectedWallets
        if (user?.walletAddress) {
          setConnectedWallets((prev) => prev.filter((addr) => addr !== user.walletAddress.toLowerCase()));
        }

        toast({
          title: "Success",
          description: "Your wallet has been disconnected successfully.",
          className: "bg-green-100 border-green-500",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to disconnect wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
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
      });
      const data = await response.json();

      if (data.success) {
        updateUser(data.user);
        toast({
          title: "Success",
          description: "Your account settings have been updated successfully.",
          className: "bg-green-100 border-green-500",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500">Manage your account settings and wallet</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
        </TabsList>

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
                  {isWalletMatched && blockchainSettings.walletConnectedAt
                    ? `Connected on ${blockchainSettings.walletConnectedAt}`
                    : "No wallet connected"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="network">Network</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <Input
                    id="network"
                    name="network"
                    value={isWalletMatched ? blockchainSettings.network : "Not connected"}
                    disabled
                  />
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
  );
}