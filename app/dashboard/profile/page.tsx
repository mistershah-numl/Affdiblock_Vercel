"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Upload, Shield, Key, AlertCircle, Check, X } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"

export default function ProfilePage() {
  const router = useRouter()
  const { user, token, updateUser, isLoading, isAuthenticated, logout } = useAuth()
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    idCardNumber: "",
    address: "",
    bio: "",
    walletAddress: "",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  useEffect(() => {
    console.log("ProfilePage auth state:", { isLoading, isAuthenticated, user: user?.email })
    if (!isLoading && !isAuthenticated) {
      console.log("ProfilePage redirecting to /login")
      router.push("/login")
    }
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        idCardNumber: user.idCardNumber || "",
        address: user.address || "",
        bio: user.bio || "",
        walletAddress: user.walletAddress || "",
      })
      setAvatarPreview(user.avatar || null)
    }
  }, [user, isLoading, isAuthenticated, router])

  useEffect(() => {
    const errors: string[] = []
    let strength = 0
    if (newPassword) {
      if (newPassword.length >= 8) strength += 25
      else errors.push("Password must be at least 8 characters long")
      if (/[A-Z]/.test(newPassword)) strength += 25
      else errors.push("Password must contain at least one uppercase letter")
      if (/\d/.test(newPassword)) strength += 25
      else errors.push("Password must contain at least one number")
      if (/[^A-Za-z0-9]/.test(newPassword)) strength += 25
      else errors.push("Password must contain at least one special character")
      if (formData.name && formData.name.length > 2) {
        const nameParts = formData.name.toLowerCase().split(" ")
        for (const part of nameParts) {
          if (part.length > 2 && newPassword.toLowerCase().includes(part)) {
            errors.push("Password cannot contain parts of your name")
            strength = Math.max(0, strength - 25)
            break
          }
        }
      }
    }
    setPasswordStrength(strength)
    setPasswordErrors(errors)
  }, [newPassword, formData.name])

  const handleSaveProfile = async () => {
    setIsProfileLoading(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          bio: formData.bio,
          walletAddress: formData.walletAddress,
        }),
      })
      const data = await response.json()
      if (data.success) {
        updateUser(data.user)
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProfileLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Avatar must be less than 5MB",
          variant: "destructive",
        })
        return
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Avatar must be an image file",
          variant: "destructive",
        })
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      toast({
        title: "Error",
        description: "Please select an image to upload",
        variant: "destructive",
      })
      return
    }

    setIsProfileLoading(true)
    try {
      const formData = new FormData()
      formData.append("avatar", avatarFile)
      const response = await fetch("/api/user/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      const data = await response.json()
      if (data.success) {
        updateUser(data.user)
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully.",
        })
        setAvatarFile(null)
        setAvatarPreview(data.user.avatar)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update avatar",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProfileLoading(false)
    }
  }

  const validatePasswordForm = () => {
    const errors: {
      currentPassword?: string
      newPassword?: string
      confirmPassword?: string
    } = {}
    if (!currentPassword) errors.currentPassword = "Current password is required"
    if (!newPassword) errors.newPassword = "New password is required"
    else if (passwordErrors.length > 0) errors.newPassword = "Password does not meet requirements"
    if (!confirmPassword) errors.confirmPassword = "Please confirm your new password"
    else if (newPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match"
    return errors
  }

  const handleChangePassword = async () => {
    const errors = validatePasswordForm()
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Error",
        description: Object.values(errors)[0],
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully. Redirecting to login...",
          className: "bg-green-100 dark:bg-green-900 border-green-500",
        })
        logout() // Call logout immediately after toast
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update password",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "Very Weak"
    if (passwordStrength <= 25) return "Weak"
    if (passwordStrength <= 50) return "Medium"
    if (passwordStrength <= 75) return "Strong"
    return "Very Strong"
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-200 dark:bg-gray-700"
    if (passwordStrength <= 25) return "bg-red-500"
    if (passwordStrength <= 50) return "bg-orange-500"
    if (passwordStrength <= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  if (!user) {
    return <div>Loading user data...</div>
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-gray-500">Manage your account settings and profile information</p>
          </div>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>View and update your profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-32 w-32">
                        <AvatarImage
                          src={avatarPreview || user.avatar || "/placeholder.svg?height=128&width=128"}
                          alt={user.name || "User"}
                        />
                        <AvatarFallback className="text-2xl">{user.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          <span>{user.avatar ? "Change Photo" : "Upload Photo"}</span>
                        </Button>
                        {avatarFile && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex items-center gap-2 w-full"
                            onClick={handleAvatarUpload}
                            disabled={isProfileLoading}
                          >
                            {isProfileLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            <span>Save Photo</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled
                          />
                          <p className="text-xs text-gray-500">Email cannot be changed</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="idCardNumber">ID Card Number</Label>
                          <Input
                            id="idCardNumber"
                            name="idCardNumber"
                            value={formData.idCardNumber}
                            onChange={handleInputChange}
                            disabled
                          />
                          <p className="text-xs text-gray-500">ID Card Number cannot be changed</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="walletAddress">Wallet Address</Label>
                          <Input
                            id="walletAddress"
                            name="walletAddress"
                            value={formData.walletAddress}
                            onChange={handleInputChange}
                            placeholder="0x..."
                          />
                          <p className="text-xs text-gray-500">Your Ethereum wallet address</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Account Status</Label>
                          <Input id="status" value={user.status || "N/A"} disabled />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          placeholder="Tell us about yourself"
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>ID Card Front</Label>
                          {user.idCardFrontUrl ? (
                            <div className="relative h-48 w-full">
                              <Image
                                src={user.idCardFrontUrl}
                                alt="ID Card Front"
                                fill
                                style={{ objectFit: "contain" }}
                                className="rounded-md"
                              />
                            </div>
                          ) : (
                            <p className="text-gray-500">No image uploaded</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>ID Card Back</Label>
                          {user.idCardBackUrl ? (
                            <div className="relative h-48 w-full">
                              <Image
                                src={user.idCardBackUrl}
                                alt="ID Card Back"
                                fill
                                style={{ objectFit: "contain" }}
                                className="rounded-md"
                              />
                            </div>
                          ) : (
                            <p className="text-gray-500">No image uploaded</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="createdAt">Created At</Label>
                          <Input
                            id="createdAt"
                            value={user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="updatedAt">Last Updated</Label>
                          <Input
                            id="updatedAt"
                            value={user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "N/A"}
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={isProfileLoading}>
                    {isProfileLoading ? (
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
            <TabsContent value="account" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Manage your account settings and role information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Account Status</h3>
                        <p className="text-sm text-gray-500">Your account is active and in good standing</p>
                      </div>
                      <Badge className={user.status === "Active" ? "bg-green-500" : "bg-red-500"}>
                        {user.status || "Active"}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Account Role</h3>
                        <p className="text-sm text-gray-500">Your current role in the system</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">{user.role}</span>
                      </div>
                    </div>
                    {user.role === "User" && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-lg font-medium">Request Issuer Role</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            If you are a legal professional, you can request to become an issuer to create and manage
                            affidavits
                          </p>
                          <Button variant="outline">Request Issuer Role</Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Delete Account</CardTitle>
                  <CardDescription>Permanently delete your account and all associated data</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">
                    Once you delete your account, there is no going back. All information associated with your account
                    will be permanently deleted.
                  </p>
                  <Button variant="destructive">Delete Account</Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="security" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    {newPassword && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Progress value={passwordStrength} className={getPasswordStrengthColor()} />
                          <span className="text-xs ml-2">{getPasswordStrengthText()}</span>
                        </div>
                        <div className="space-y-1">
                          {passwordErrors.map((error, index) => (
                            <p key={index} className="text-xs flex items-center gap-1 text-amber-500 dark:text-amber-400">
                              <X className="h-3 w-3" /> {error}
                            </p>
                          ))}
                          {passwordStrength === 100 && (
                            <p className="text-xs flex items-center gap-1 text-green-500">
                              <Check className="h-3 w-3" /> Password meets all requirements
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">
                    Two-factor authentication adds an additional layer of security to your account by requiring more
                    than just a password to sign in.
                  </p>
                  <Button variant="outline">Enable Two-Factor Authentication</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}