"use client";

import type React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Upload, Shield, Key, Check, X } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Helper function for avatar URL (direct IPFS or placeholder)
const getAvatarUrl = (path: string | null | undefined) => {
  if (!path || !path.startsWith("https://gateway.pinata.cloud/ipfs/")) {
    return "/placeholder.svg?height=128&width=128";
  }
  return path;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, updateUser, isLoading, isAuthenticated, logout } = useAuth();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    idCardNumber: "",
    address: "",
    bio: "",
    activeRole: "",
    organization: "",
    city: "",
    designation: "",
    dateOfJoining: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const [isIssuerRequestDialogOpen, setIsIssuerRequestDialogOpen] = useState(false);
  const [issuerRequestForm, setIssuerRequestForm] = useState({
    licenseFile: null as File | null,
    organization: "",
    city: "",
    designation: "",
    dateOfJoining: "",
  });
  const licenseInputRef = useRef<HTMLInputElement>(null);

  // Memoize image URLs to prevent refetching on tab switch
  const avatarUrl = useMemo(() => getAvatarUrl(user?.avatar), [user?.avatar]);
  const idCardFrontUrl = useMemo(() => user?.idCardFrontUrl || "/placeholder.svg?height=128&width=128", [user?.idCardFrontUrl]);
  const idCardBackUrl = useMemo(() => user?.idCardBackUrl || "/placeholder.svg?height=128&width=128", [user?.idCardBackUrl]);
  const licenseUrl = useMemo(() => user?.licenseUrl || "/placeholder.svg?height=128&width=128", [user?.licenseUrl]);

  // Debug image URLs
  useEffect(() => {
    console.log("Profile URLs:", {
      avatar: user?.avatar,
      avatarProcessed: avatarUrl,
      idCardFront: idCardFrontUrl,
      idCardBack: idCardBackUrl,
      license: licenseUrl,
      timestamp: new Date().toISOString(),
    });
  }, [avatarUrl, idCardFrontUrl, idCardBackUrl, licenseUrl]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        idCardNumber: user.idCardNumber || "",
        address: user.address || "",
        bio: user.bio || "",
        activeRole: user.activeRole || "",
        organization: user.organization || "",
        city: user.city || "",
        designation: user.designation || "",
        dateOfJoining: user.dateOfJoining ? new Date(user.dateOfJoining).toISOString().split("T")[0] : "",
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user, isLoading, isAuthenticated, router]);

  useEffect(() => {
    const errors: string[] = [];
    let strength = 0;
    if (newPassword) {
      if (newPassword.length >= 8) strength += 25;
      else errors.push("Password must be at least 8 characters long");
      if (/[A-Z]/.test(newPassword)) strength += 25;
      else errors.push("Password must contain at least one uppercase letter");
      if (/\d/.test(newPassword)) strength += 25;
      else errors.push("Password must contain at least one number");
      if (/[^A-Za-z0-9]/.test(newPassword)) strength += 25;
      else errors.push("Password must contain at least one special character");
      if (formData.name && formData.name.length > 2) {
        const nameParts = formData.name.toLowerCase().split(" ");
        for (const part of nameParts) {
          if (part.length > 2 && newPassword.toLowerCase().includes(part)) {
            errors.push("Password cannot contain parts of your name");
            strength = Math.max(0, strength - 25);
            break;
          }
        }
      }
    }
    setPasswordStrength(strength);
    setPasswordErrors(errors);
  }, [newPassword, formData.name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, activeRole: value }));
  };

  const handleIssuerRequestInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setIssuerRequestForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "License file must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      if (!file.type.match(/^(image\/|application\/pdf)/)) {
        toast({
          title: "Error",
          description: "License must be an image or PDF file",
          variant: "destructive",
        });
        return;
      }
      setIssuerRequestForm((prev) => ({ ...prev, licenseFile: file }));
    }
  };

  const handleSaveProfile = async () => {
    setIsProfileLoading(true);
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
          activeRole: formData.activeRole,
          organization: formData.organization,
          city: formData.city,
          designation: formData.designation,
          dateOfJoining: formData.dateOfJoining || undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        updateUser(data.user);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Avatar must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Avatar must be an image file",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      toast({
        title: "Error",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }

    setIsProfileLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      const response = await fetch("/api/user/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        updateUser(data.user);
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been uploaded successfully. Reloading page...",
        });
        setAvatarFile(null);
        setAvatarPreview(null);
        setAvatarKey(Date.now());
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update avatar",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const validatePasswordForm = () => {
    const errors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};
    if (!currentPassword) errors.currentPassword = "Current password is required";
    if (!newPassword) errors.newPassword = "New password is required";
    else if (passwordErrors.length > 0) errors.newPassword = "Password does not meet requirements";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your new password";
    else if (newPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    return errors;
  };

  const handleChangePassword = async () => {
    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Error",
        description: Object.values(errors)[0],
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
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
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully. Redirecting to login...",
          className: "bg-green-100 border-green-500",
        });
        setTimeout(() => {
          logout();
          router.push("/login");
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const validateIssuerRequestForm = () => {
    const errors: {
      licenseFile?: string;
      organization?: string;
      city?: string;
      designation?: string;
      dateOfJoining?: string;
    } = {};
    if (!issuerRequestForm.licenseFile) errors.licenseFile = "License file is required";
    if (!issuerRequestForm.organization) errors.organization = "Organization is required";
    if (!issuerRequestForm.city) errors.city = "City is required";
    if (!issuerRequestForm.designation) errors.designation = "Designation is required";
    if (!issuerRequestForm.dateOfJoining) errors.dateOfJoining = "Date of joining is required";
    return errors;
  };

  const handleSubmitIssuerRequest = async () => {
    const errors = validateIssuerRequestForm();
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Error",
        description: Object.values(errors)[0],
        variant: "destructive",
      });
      return;
    }

    setIsProfileLoading(true);
    try {
      const formData = new FormData();
      formData.append("license", issuerRequestForm.licenseFile!);
      formData.append("organization", issuerRequestForm.organization);
      formData.append("city", issuerRequestForm.city);
      formData.append("designation", issuerRequestForm.designation);
      formData.append("dateOfJoining", issuerRequestForm.dateOfJoining);

      const response = await fetch("/api/issuer-requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Issuer role request submitted successfully",
        });
        setIsIssuerRequestDialogOpen(false);
        setIssuerRequestForm({
          licenseFile: null,
          organization: "",
          city: "",
          designation: "",
          dateOfJoining: "",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to submit issuer request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "Very Weak";
    if (passwordStrength <= 25) return "Weak";
    if (passwordStrength <= 50) return "Medium";
    if (passwordStrength <= 75) return "Strong";
    return "Very Strong";
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-200";
    if (passwordStrength <= 25) return "bg-red-500";
    if (passwordStrength <= 50) return "bg-orange-500";
    if (passwordStrength <= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 p-6">
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

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>View and update your profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center space-y-4">
                    {avatarPreview || avatarUrl !== "/placeholder.svg?height=128&width=128" ? (
                      <div className="relative h-32 w-32 overflow-hidden rounded-full">
                        {avatarPreview ? (
                          <img
                            key={avatarKey}
                            src={avatarPreview}
                            alt={user.name || "User"}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <img
                            key={avatarKey}
                            src={avatarUrl}
                            alt={user.name || "User"}
                            className="h-full w-full rounded-full object-cover"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted">
                        <span className="text-2xl">{user.name?.charAt(0) || "U"}</span>
                      </div>
                    )}
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
                        <span>{avatarUrl !== "/placeholder.svg?height=128&width=128" ? "Change Photo" : "Upload Photo"}</span>
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
                        <Label htmlFor="activeRole">Default Role</Label>
                        <Select value={formData.activeRole} onValueChange={handleRoleChange}>
                          <SelectTrigger id="activeRole">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {user.roles.map((role: string) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">Select the default role to use when logging in</p>
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
                    {user.roles.includes("Issuer") && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="organization">Organization</Label>
                            <Input
                              id="organization"
                              name="organization"
                              value={formData.organization}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="designation">Designation</Label>
                            <Input
                              id="designation"
                              name="designation"
                              value={formData.designation}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dateOfJoining">Date of Joining</Label>
                            <Input
                              id="dateOfJoining"
                              name="dateOfJoining"
                              type="date"
                              value={formData.dateOfJoining}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>License</Label>
                          {licenseUrl !== "/placeholder.svg?height=128&width=128" ? (
                            <div className="relative h-48 w-full">
                              {licenseUrl.endsWith(".pdf") ? (
                                <a href={licenseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                  View License (PDF)
                                </a>
                              ) : (
                                <Image
                                  src={licenseUrl}
                                  alt="License"
                                  fill
                                  style={{ objectFit: "contain" }}
                                  className="rounded-md"
                                />
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500">No license uploaded</p>
                          )}
                          <p className="text-xs text-gray-500">License cannot be changed</p>
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>ID Card Front</Label>
                        {idCardFrontUrl !== "/placeholder.svg?height=128&width=128" ? (
                          <div className="relative h-48 w-full">
                            <Image
                              src={idCardFrontUrl}
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
                        {idCardBackUrl !== "/placeholder.svg?height=128&width=128" ? (
                          <div className="relative h-48 w-full">
                            <Image
                              src={idCardBackUrl}
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

          <TabsContent value="account" className="mt-6">
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
                      <span className="font-medium">{user.activeRole}</span>
                    </div>
                  </div>
                  {user.activeRole === "User" && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-medium">Request Issuer Role</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          If you are a legal professional, you can request to become an issuer to create and manage affidavits
                        </p>
                        <Button variant="outline" onClick={() => setIsIssuerRequestDialogOpen(true)}>
                          Request Issuer Role
                        </Button>
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

          <TabsContent value="security" className="mt-6">
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
                          <p key={index} className="text-xs flex items-center gap-1 text-amber-500">
                            <X className="h-3 w-3" />
                            {error}
                          </p>
                        ))}
                        {passwordStrength === 100 && (
                          <p className="text-xs flex items-center gap-1 text-green-500">
                            <Check className="h-3 w-3" />
                            Password meets all requirements
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

        <Dialog open={isIssuerRequestDialogOpen} onOpenChange={setIsIssuerRequestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Issuer Role</DialogTitle>
              <DialogDescription>
                Submit your details and license to request the Issuer role.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="license">License Document</Label>
                <input
                  ref={licenseInputRef}
                  type="file"
                  id="license"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleLicenseChange}
                />
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => licenseInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  <span>{issuerRequestForm.licenseFile ? issuerRequestForm.licenseFile.name : "Upload License"}</span>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    name="organization"
                    value={issuerRequestForm.organization}
                    onChange={handleIssuerRequestInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={issuerRequestForm.city}
                    onChange={handleIssuerRequestInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    name="designation"
                    value={issuerRequestForm.designation}
                    onChange={handleIssuerRequestInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfJoining">Date of Joining</Label>
                  <Input
                    id="dateOfJoining"
                    name="dateOfJoining"
                    type="date"
                    value={issuerRequestForm.dateOfJoining}
                    onChange={handleIssuerRequestInputChange}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsIssuerRequestDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitIssuerRequest} disabled={isProfileLoading}>
                {isProfileLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}

//earlier 730 lines