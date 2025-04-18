"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Lock, Mail, Shield, Smartphone, Globe, Wallet, Save, Loader2, FileText } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)

  // Account settings
  const [accountSettings, setAccountSettings] = useState({
    email: "john.doe@example.com",
    language: "english",
    timezone: "UTC+5",
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    affidavitUpdates: true,
    marketingEmails: false,
    securityAlerts: true,
  })

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: "30",
  })

  // Blockchain settings
  const [blockchainSettings, setBlockchainSettings] = useState({
    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    network: "ethereum",
    autoVerify: true,
  })

  const handleAccountSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setAccountSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleNotificationToggle = (name: string) => {
    setNotificationSettings((prev) => ({ ...prev, [name]: !prev[name as keyof typeof prev] }))
  }

  const handleSecuritySettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSecuritySettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSecurityToggle = (name: string) => {
    setSecuritySettings((prev) => ({ ...prev, [name]: !prev[name as keyof typeof prev] }))
  }

  const handleBlockchainSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setBlockchainSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleBlockchainToggle = (name: string) => {
    setBlockchainSettings((prev) => ({ ...prev, [name]: !prev[name as keyof typeof prev] }))
  }

  const handleSaveSettings = (section: string) => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Show success message or notification
      alert(`${section} settings saved successfully!`)
    }, 1000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
          </TabsList>

          {/* Account Settings */}
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
                      <option value="UTC">UTC+00:00</option>
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
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Account")} disabled={isLoading}>
                  {isLoading ? (
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

          {/* Notification Settings */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label htmlFor="emailNotifications" className="text-base">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={() => handleNotificationToggle("emailNotifications")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label htmlFor="pushNotifications" className="text-base">
                          Push Notifications
                        </Label>
                        <p className="text-sm text-gray-500">Receive notifications on your device</p>
                      </div>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={() => handleNotificationToggle("pushNotifications")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label htmlFor="affidavitUpdates" className="text-base">
                          Affidavit Updates
                        </Label>
                        <p className="text-sm text-gray-500">Get notified about changes to your affidavits</p>
                      </div>
                    </div>
                    <Switch
                      id="affidavitUpdates"
                      checked={notificationSettings.affidavitUpdates}
                      onCheckedChange={() => handleNotificationToggle("affidavitUpdates")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label htmlFor="marketingEmails" className="text-base">
                          Marketing Emails
                        </Label>
                        <p className="text-sm text-gray-500">Receive promotional emails and updates</p>
                      </div>
                    </div>
                    <Switch
                      id="marketingEmails"
                      checked={notificationSettings.marketingEmails}
                      onCheckedChange={() => handleNotificationToggle("marketingEmails")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label htmlFor="securityAlerts" className="text-base">
                          Security Alerts
                        </Label>
                        <p className="text-sm text-gray-500">Get notified about security-related events</p>
                      </div>
                    </div>
                    <Switch
                      id="securityAlerts"
                      checked={notificationSettings.securityAlerts}
                      onCheckedChange={() => handleNotificationToggle("securityAlerts")}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Notification")} disabled={isLoading}>
                  {isLoading ? (
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

          {/* Security Settings */}
          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label htmlFor="twoFactorAuth" className="text-base">
                          Two-Factor Authentication
                        </Label>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <Switch
                      id="twoFactorAuth"
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={() => handleSecurityToggle("twoFactorAuth")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label htmlFor="loginAlerts" className="text-base">
                          Login Alerts
                        </Label>
                        <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
                      </div>
                    </div>
                    <Switch
                      id="loginAlerts"
                      checked={securitySettings.loginAlerts}
                      onCheckedChange={() => handleSecurityToggle("loginAlerts")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-gray-500" />
                      <select
                        id="sessionTimeout"
                        name="sessionTimeout"
                        value={securitySettings.sessionTimeout}
                        onChange={handleSecuritySettingChange}
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

                  <div className="pt-4">
                    <Button variant="outline" className="w-full">
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Security")} disabled={isLoading}>
                  {isLoading ? (
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

          {/* Blockchain Settings */}
          <TabsContent value="blockchain" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Settings</CardTitle>
                <CardDescription>Manage your blockchain and verification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Wallet Address</Label>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-gray-500" />
                    <Input
                      id="walletAddress"
                      name="walletAddress"
                      value={blockchainSettings.walletAddress}
                      onChange={handleBlockchainSettingChange}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Your blockchain wallet address for signing transactions</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="network">Blockchain Network</Label>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <select
                      id="network"
                      name="network"
                      value={blockchainSettings.network}
                      onChange={handleBlockchainSettingChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="ethereum">Ethereum Mainnet</option>
                      <option value="polygon">Polygon</option>
                      <option value="binance">Binance Smart Chain</option>
                      <option value="avalanche">Avalanche</option>
                      <option value="optimism">Optimism</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">Select the blockchain network for your affidavits</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <div>
                      <Label htmlFor="autoVerify" className="text-base">
                        Auto-Verify
                      </Label>
                      <p className="text-sm text-gray-500">Automatically verify affidavits on the blockchain</p>
                    </div>
                  </div>
                  <Switch
                    id="autoVerify"
                    checked={blockchainSettings.autoVerify}
                    onCheckedChange={() => handleBlockchainToggle("autoVerify")}
                  />
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect New Wallet
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Blockchain")} disabled={isLoading}>
                  {isLoading ? (
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
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
