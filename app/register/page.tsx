"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Mail, User, Upload, AlertCircle, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [idCardNumber, setIdCardNumber] = useState("")
  const [formattedIdCardNumber, setFormattedIdCardNumber] = useState("")
  const [idCardFront, setIdCardFront] = useState<File | null>(null)
  const [idCardBack, setIdCardBack] = useState<File | null>(null)
  const [idCardFrontPreview, setIdCardFrontPreview] = useState<string | null>(null)
  const [idCardBackPreview, setIdCardBackPreview] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
    idCardNumber?: string
    idCardFront?: string
    idCardBack?: string
  }>({})
  const [error, setError] = useState<string | null>(null)

  const idCardFrontRef = useRef<HTMLInputElement>(null)
  const idCardBackRef = useRef<HTMLInputElement>(null)

  // Format ID card number as user types (11111-1111111-1)
  useEffect(() => {
    const formatIdCardNumber = (value: string) => {
      // Remove all non-numeric characters
      const numericValue = value.replace(/\D/g, "")

      if (numericValue.length <= 5) {
        return numericValue
      } else if (numericValue.length <= 12) {
        return `${numericValue.slice(0, 5)}-${numericValue.slice(5)}`
      } else {
        return `${numericValue.slice(0, 5)}-${numericValue.slice(5, 12)}-${numericValue.slice(12, 13)}`
      }
    }

    setFormattedIdCardNumber(formatIdCardNumber(idCardNumber))
  }, [idCardNumber])

  // Check password strength and requirements
  useEffect(() => {
    const errors: string[] = []
    let strength = 0

    if (password) {
      // Check for minimum length
      if (password.length >= 8) {
        strength += 25
      } else {
        errors.push("Password must be at least 8 characters long")
      }

      // Check for uppercase letter
      if (/[A-Z]/.test(password)) {
        strength += 25
      } else {
        errors.push("Password must contain at least one uppercase letter")
      }

      // Check for number
      if (/\d/.test(password)) {
        strength += 25
      } else {
        errors.push("Password must contain at least one number")
      }

      // Check for special character
      if (/[^A-Za-z0-9]/.test(password)) {
        strength += 25
      } else {
        errors.push("Password must contain at least one special character")
      }

      // Check if password contains part of the name
      if (name && name.length > 2) {
        const nameParts = name.toLowerCase().split(" ")
        for (const part of nameParts) {
          if (part.length > 2 && password.toLowerCase().includes(part)) {
            errors.push("Password cannot contain parts of your name")
            strength = Math.max(0, strength - 25)
            break
          }
        }
      }
    }

    setPasswordStrength(strength)
    setPasswordErrors(errors)
  }, [password, name])

  const handleIdCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and limit to 13 digits
    const value = e.target.value.replace(/\D/g, "").slice(0, 13)
    setIdCardNumber(value)
  }

  const handleIdCardFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIdCardFront(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setIdCardFrontPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleIdCardBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIdCardBack(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setIdCardBackPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const errors: {
      name?: string
      email?: string
      password?: string
      confirmPassword?: string
      idCardNumber?: string
      idCardFront?: string
      idCardBack?: string
    } = {}

    // Validate name
    if (!name.trim()) {
      errors.name = "Full name is required"
    }

    // Validate email
    if (!email.trim()) {
      errors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid"
    }

    // Validate password
    if (!password) {
      errors.password = "Password is required"
    } else if (passwordErrors.length > 0) {
      errors.password = "Password does not meet requirements"
    }

    // Validate confirm password
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    // Validate ID card number
    if (!idCardNumber) {
      errors.idCardNumber = "ID card number is required"
    } else if (idCardNumber.replace(/\D/g, "").length !== 13) {
      errors.idCardNumber = "ID card number must be 13 digits"
    }

    // Validate ID card front image
    if (!idCardFront) {
      errors.idCardFront = "ID card front image is required"
    }

    // Validate ID card back image
    if (!idCardBack) {
      errors.idCardBack = "ID card back image is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Create form data for multipart/form-data submission
      const formData = new FormData()
      formData.append("name", name)
      formData.append("email", email)
      formData.append("password", password)
      formData.append("idCardNumber", idCardNumber)

      // Append files
      if (idCardFront) {
        formData.append("idCardFront", idCardFront)
      }

      if (idCardBack) {
        formData.append("idCardBack", idCardBack)
      }

      // Register user
      const result = await register(formData)

      if (result.success) {
        toast({
          title: "Registration successful",
          description: "Welcome to AffidBlock!",
        })
        router.push("/dashboard")
      } else {
        setError(result.error || "Registration failed")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Registration error:", err)
    } finally {
      setIsLoading(false)
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

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-xl">
        <Card className="border-none shadow-xl dark:bg-gray-800/60 dark:backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
            <CardDescription className="text-center dark:text-gray-400">
              Enter your information to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form 
            onSubmit={(e)=>{
              console.log("Form Submitted");
              handleSubmit(e);
            }} 
            className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn("pl-10", formErrors.name && "border-red-500 focus-visible:ring-red-500")}
                  />
                </div>
                {formErrors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {formErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn("pl-10", formErrors.email && "border-red-500 focus-visible:ring-red-500")}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {formErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn("pl-10", formErrors.password && "border-red-500 focus-visible:ring-red-500")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Progress value={passwordStrength} className={cn("h-1", getPasswordStrengthColor())} />
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
                {formErrors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {formErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn("pl-10", formErrors.confirmPassword && "border-red-500 focus-visible:ring-red-500")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {formErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="idCardNumber">ID Card Number</Label>
                <div className="relative">
                  <Input
                    id="idCardNumber"
                    placeholder="Enter 13 digit ID card number"
                    value={idCardNumber}
                    onChange={handleIdCardNumberChange}
                    className={cn(formErrors.idCardNumber && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {formattedIdCardNumber && (
                    <div className="absolute right-3 top-3 text-sm text-gray-500">Format: {formattedIdCardNumber}</div>
                  )}
                </div>
                {formErrors.idCardNumber && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {formErrors.idCardNumber}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idCardFront">ID Card Front</Label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                      formErrors.idCardFront ? "border-red-500" : "border-gray-300 dark:border-gray-600",
                    )}
                    onClick={() => idCardFrontRef.current?.click()}
                  >
                    <input
                      ref={idCardFrontRef}
                      id="idCardFront"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleIdCardFrontUpload}
                    />

                    {idCardFrontPreview ? (
                      <div className="relative">
                        <img
                          src={idCardFrontPreview || "/placeholder.svg"}
                          alt="ID Card Front"
                          className="max-h-32 mx-auto rounded-md"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIdCardFront(null)
                            setIdCardFrontPreview(null)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload front side</p>
                      </div>
                    )}
                  </div>
                  {formErrors.idCardFront && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {formErrors.idCardFront}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idCardBack">ID Card Back</Label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                      formErrors.idCardBack ? "border-red-500" : "border-gray-300 dark:border-gray-600",
                    )}
                    onClick={() => idCardBackRef.current?.click()}
                  >
                    <input
                      ref={idCardBackRef}
                      id="idCardBack"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleIdCardBackUpload}
                    />

                    {idCardBackPreview ? (
                      <div className="relative">
                        <img
                          src={idCardBackPreview || "/placeholder.svg"}
                          alt="ID Card Back"
                          className="max-h-32 mx-auto rounded-md"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIdCardBack(null)
                            setIdCardBackPreview(null)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload back side</p>
                      </div>
                    )}
                  </div>
                  {formErrors.idCardBack && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {formErrors.idCardBack}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="terms" required />
                <Label htmlFor="terms" className="text-sm font-normal">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">Already have an account?</span>{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
