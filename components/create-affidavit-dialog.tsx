"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, X, Plus, User, Users, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

interface CreateAffidavitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface User {
  _id: string
  name: string
  email: string
  roles: string[]
  idCardNumber?: string
  area?: string
  walletAddress?: string
}

const categories = [
  { id: "property", name: "Property", stampValue: "500" },
  { id: "vehicle", name: "Vehicle", stampValue: "300" },
  { id: "business", name: "Business", stampValue: "400" },
  { id: "personal", name: "Personal", stampValue: "200" },
  { id: "education", name: "Education", stampValue: "150" },
  { id: "employment", name: "Employment", stampValue: "250" },
  { id: "legal", name: "Legal", stampValue: "350" },
  { id: "financial", name: "Financial", stampValue: "450" },
]

const categoryFields: Record<string, { label: string; name: string; type: string; required: boolean }[]> = {
  vehicle: [
    { label: "Car Make", name: "carMake", type: "text", required: true },
    { label: "Model", name: "model", type: "text", required: true },
    { label: "Year", name: "year", type: "number", required: true },
    { label: "VIN", name: "vin", type: "text", required: true },
    { label: "Registration Number", name: "registrationNumber", type: "text", required: true },
  ],
  property: [
    { label: "Address", name: "address", type: "text", required: true },
    { label: "Size (sqft)", name: "size", type: "number", required: true },
    { label: "Property Type", name: "propertyType", type: "select", required: true },
    { label: "Ownership Details", name: "ownershipDetails", type: "text", required: false },
  ],
}

const propertyTypes = ["Residential", "Commercial", "Industrial"]

export default function CreateAffidavitDialog({ open, onOpenChange }: CreateAffidavitDialogProps) {
  const router = useRouter()
  const { token, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasWallet, setHasWallet] = useState<boolean | null>(null)
  const [initiatorIdCardNumber, setInitiatorIdCardNumber] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [stampValue, setStampValue] = useState("")
  const [issuerId, setIssuerId] = useState("")
  const [issuerHasWallet, setIssuerHasWallet] = useState<boolean | null>(null) // Added state for issuer wallet check
  const [description, setDescription] = useState("")
  const [declaration, setDeclaration] = useState("")

  // User role state (Seller/Buyer)
  const [userRole, setUserRole] = useState("")
  const [sellerId, setSellerId] = useState("")
  const [buyerId, setBuyerId] = useState("")
  const [sellerHasWallet, setSellerHasWallet] = useState<boolean | null>(null)
  const [buyerHasWallet, setBuyerHasWallet] = useState<boolean | null>(null)

  // Dynamic fields state
  const [details, setDetails] = useState<Record<string, string | number>>({})

  // Document upload state
  const [documents, setDocuments] = useState<File[]>([])
  const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"]

  // Parties and witnesses state
  const [witnesses, setWitnesses] = useState<Array<{ contactId: string; name: string }>>([])

  // Data fetching state
  const [issuers, setIssuers] = useState<User[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Temporary state for selecting issuer
  const [issuerOpen, setIssuerOpen] = useState(false)

  // Temporary state for selecting seller/buyer
  const [sellerOpen, setSellerOpen] = useState(false)
  const [buyerOpen, setBuyerOpen] = useState(false)

  // Temporary state for adding a witness
  const [witnessContactId, setWitnessContactId] = useState("")
  const [witnessContactOpen, setWitnessContactOpen] = useState(false)

  // Fetch issuers, users, and check wallet on component mount
  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, token])

  const fetchData = async () => {
    setIsLoadingData(true)
    try {
      const response = await fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setIssuers(data.issuers || [])
        setUsers(data.users || [])

        // Set the current user's wallet status and ID card number
        if (data.currentUser) {
          setHasWallet(!!data.currentUser.walletAddress)
          setInitiatorIdCardNumber(data.currentUser.idCardNumber || null)
          console.log("Current user wallet address:", data.currentUser.walletAddress)
        } else {
          setHasWallet(false)
          toast({
            title: "Error",
            description: "Current user data not found",
            variant: "destructive",
          })
        }
      } else {
        setIssuers([])
        setUsers([])
        setHasWallet(false)
        toast({
          title: "Error",
          description: data.error || "Failed to fetch users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      setIssuers([])
      setUsers([])
      setHasWallet(false)
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching users",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  // Check wallet status for Issuer
  useEffect(() => {
    if (issuerId) {
      const selectedIssuer = issuers.find((u) => u._id === issuerId)
      setIssuerHasWallet(!!selectedIssuer?.walletAddress)
    } else {
      setIssuerHasWallet(null)
    }
  }, [issuerId, issuers])

  // Check wallet status for Seller
  useEffect(() => {
    if (sellerId) {
      const selectedSeller = users.find((u) => u._id === sellerId)
      setSellerHasWallet(!!selectedSeller?.walletAddress)
    } else {
      setSellerHasWallet(null)
    }
  }, [sellerId, users])

  // Check wallet status for Buyer
  useEffect(() => {
    if (buyerId) {
      const selectedBuyer = users.find((u) => u._id === buyerId)
      setBuyerHasWallet(!!selectedBuyer?.walletAddress)
    } else {
      setBuyerHasWallet(null)
    }
  }, [buyerId, users])

  // Update stamp value and reset dynamic fields when category changes
  useEffect(() => {
    const selectedCategory = categories.find((cat) => cat.id === category)
    setStampValue(selectedCategory ? selectedCategory.stampValue : "")
    setDetails({}) // Reset dynamic fields when category changes
  }, [category])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setTitle("")
    setCategory("")
    setStampValue("")
    setIssuerId("")
    setIssuerHasWallet(null) // Reset issuer wallet status
    setDescription("")
    setDeclaration("")
    setUserRole("")
    setSellerId("")
    setBuyerId("")
    setSellerHasWallet(null)
    setBuyerHasWallet(null)
    setDetails({})
    setDocuments([])
    setWitnesses([])
    setWitnessContactId("")
  }

  const handleAddWitness = () => {
    if (witnessContactId) {
      const contact = users.find((c) => c._id === witnessContactId)
      if (contact) {
        if (!witnesses.some((w) => w.contactId === witnessContactId)) {
          setWitnesses([...witnesses, { contactId: witnessContactId, name: contact.name }])
          setWitnessContactId("")
        } else {
          toast({
            title: "Duplicate Witness",
            description: "This contact has already been added as a witness.",
            variant: "destructive",
          })
        }
      }
    }
  }

  const handleRemoveWitness = (index: number) => {
    const updatedWitnesses = [...witnesses]
    updatedWitnesses.splice(index, 1)
    setWitnesses(updatedWitnesses)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []

    files.forEach((file) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Only PDF, JPEG, and PNG files are allowed.",
          variant: "destructive",
        })
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: "Each file must be less than 2MB.",
          variant: "destructive",
        })
        return
      }

      validFiles.push(file)
    })

    setDocuments([...documents, ...validFiles])
  }

  const handleRemoveDocument = (index: number) => {
    const updatedDocuments = [...documents]
    updatedDocuments.splice(index, 1)
    setDocuments(updatedDocuments)
  }

  const handleDetailChange = (name: string, value: string | number) => {
    setDetails((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    // Validation
    if (!title || !category || !issuerId || !userRole || !description || !declaration) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (*).",
        variant: "destructive",
      })
      return
    }
    if (userRole === "Buyer" && !sellerId) {
      toast({
        title: "Validation Error",
        description: "Please select a Seller.",
        variant: "destructive",
      })
      return
    }
    if (userRole === "Seller" && !buyerId) {
      toast({
        title: "Validation Error",
        description: "Please select a Buyer.",
        variant: "destructive",
      })
      return
    }

    // Validate dynamic fields
    const currentFields = categoryFields[category] || []
    for (const field of currentFields) {
      if (field.required && !details[field.name]) {
        toast({
          title: "Validation Error",
          description: `Please fill in the required field: ${field.label}`,
          variant: "destructive",
        })
        return
      }
    }

    // Check if Issuer has a connected wallet
    if (issuerHasWallet === false) {
      toast({
        title: "Validation Error",
        description: "The selected Issuer does not have a connected wallet.",
        variant: "destructive",
      })
      return
    }

    // Check if Seller/Buyer have connected wallets
    if (userRole === "Buyer" && sellerHasWallet === false) {
      toast({
        title: "Validation Error",
        description: "The selected Seller does not have a connected wallet.",
        variant: "destructive",
      })
      return
    }
    if (userRole === "Seller" && buyerHasWallet === false) {
      toast({
        title: "Validation Error",
        description: "The selected Buyer does not have a connected wallet.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("category", category)
      formData.append("stampValue", stampValue)
      formData.append("issuerId", issuerId)
      formData.append("description", description)
      formData.append("declaration", declaration)
      formData.append("userRole", userRole)
      if (sellerId) formData.append("sellerId", sellerId)
      if (buyerId) formData.append("buyerId", buyerId)
      formData.append("witnesses", JSON.stringify(witnesses))
      formData.append("details", JSON.stringify(details))
      formData.append("createdBy", user?._id || "")
      formData.append("initiatorIdCardNumber", initiatorIdCardNumber || "")

      documents.forEach((file) => {
        formData.append("documents", file)
      })

      const response = await fetch("/api/affidavits/affidavit-requests/create", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        const issuerName = issuers.find((issuer) => issuer._id === issuerId)?.name || "the issuer"
        toast({
          title: "Success",
          description: `Affidavit request successfully sent to issuer ${issuerName}.`,
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit affidavit request.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting affidavit:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while submitting the affidavit.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter out the current user from the list of selectable users for Seller/Buyer
  const availableUsers = users.filter((u) => u._id !== user?._id)

  // Determine if the user selected themselves as the seller
  const isUserSeller = userRole === "Seller"

  // If data is loading, show a loading state
  if (isLoadingData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Request New Affidavit</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center">
            <p>Loading...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // If user doesn't have a connected wallet, show a message
  if (hasWallet === false) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Request New Affidavit</DialogTitle>
            <DialogDescription>
              You need to connect a wallet to request an affidavit.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Wallet className="h-12 w-12 text-gray-500" />
            <p className="text-center text-gray-600">
              Please connect a wallet before proceeding.
            </p>
            <Button onClick={() => router.push("/dashboard/settings")}>
              Connect Wallet
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Request New Affidavit</DialogTitle>
          <DialogDescription>
            Fill in the details below to request a new affidavit. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 overflow-y-auto scrollbar-custom">
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Property Transfer Deed"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {category && (
                <div className="space-y-2">
                  <Label htmlFor="stampValue">Stamp Value (INR)</Label>
                  <Input
                    id="stampValue"
                    value={stampValue}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer *</Label>
                <Popover open={issuerOpen} onOpenChange={setIssuerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={issuerOpen}
                      className="w-full justify-between"
                    >
                      {issuerId
                        ? issuers.find((issuer) => issuer._id === issuerId)?.name
                        : "Select issuer..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search by name or ID card number..." />
                      <CommandList>
                        <CommandEmpty>No issuer found.</CommandEmpty>
                        <CommandGroup>
                          {issuers.map((issuer) => (
                            <CommandItem
                              key={issuer._id}
                              value={`${issuer.name}-${issuer.idCardNumber}`}
                              onSelect={() => {
                                setIssuerId(issuer._id)
                                setIssuerOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  issuerId === issuer._id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {issuer.name} - {issuer.area || "N/A"} - {issuer.idCardNumber || "N/A"}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {issuerId && issuerHasWallet === false && (
                  <p className="text-red-500 text-sm">Issuer has not connected a wallet yet.</p>
                )}
              </div>
            </div>

            {/* Dynamic Fields Based on Category */}
            {category && categoryFields[category] && (
              <div className="space-y-4">
                <Label>{category.charAt(0).toUpperCase() + category.slice(1)} Details</Label>
                {categoryFields[category].map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.label} {field.required ? "*" : ""}
                    </Label>
                    {field.type === "select" ? (
                      <Select
                        value={details[field.name]?.toString() || ""}
                        onValueChange={(value) => handleDetailChange(field.name, value)}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.name === "propertyType" &&
                            propertyTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        placeholder={`Enter ${field.name}`}
                        value={details[field.name] || ""}
                        onChange={(e) =>
                          handleDetailChange(
                            field.name,
                            field.type === "number" ? Number(e.target.value) : e.target.value
                          )
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* User Role (Seller/Buyer) */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userRole">Your Role *</Label>
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger id="userRole">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Seller">Seller</SelectItem>
                    <SelectItem value="Buyer">Buyer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Show "Select Seller" if user is Buyer */}
              {userRole === "Buyer" && (
                <div className="space-y-2">
                  <Label htmlFor="seller">Select Seller *</Label>
                  <Popover open={sellerOpen} onOpenChange={setSellerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={sellerOpen}
                        className="w-full justify-between"
                      >
                        {sellerId
                          ? availableUsers.find((user) => user._id === sellerId)?.name
                          : "Select seller..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search by name or ID card number..." />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            {availableUsers.map((user) => (
                              <CommandItem
                                key={user._id}
                                value={`${user.name}-${user.idCardNumber}`}
                                onSelect={() => {
                                  setSellerId(user._id)
                                  setSellerOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    sellerId === user._id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {user.name} - {user.area || "N/A"} - {user.idCardNumber || "N/A"}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {sellerId && sellerHasWallet === false && (
                    <p className="text-red-500 text-sm">Seller has not connected a wallet yet.</p>
                  )}
                </div>
              )}

              {/* Show "Select Buyer" if user is Seller */}
              {isUserSeller && (
                <div className="space-y-2">
                  <Label htmlFor="buyer">Select Buyer *</Label>
                  <Popover open={buyerOpen} onOpenChange={setBuyerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={buyerOpen}
                        className="w-full justify-between"
                      >
                        {buyerId
                          ? availableUsers.find((user) => user._id === buyerId)?.name
                          : "Select buyer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search by name or ID card number..." />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            {availableUsers.map((user) => (
                              <CommandItem
                                key={user._id}
                                value={`${user.name}-${user.idCardNumber}`}
                                onSelect={() => {
                                  setBuyerId(user._id)
                                  setBuyerOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    buyerId === user._id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {user.name} - {user.area || "N/A"} - {user.idCardNumber || "N/A"}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {buyerId && buyerHasWallet === false && (
                    <p className="text-red-500 text-sm">Buyer has not connected a wallet yet.</p>
                  )}
                </div>
              )}
            </div>

            {/* Witnesses */}
            <div className="space-y-4">
              <Label>Witnesses (Optional)</Label>

              <div className="space-y-4">
                {witnesses.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-custom">
                    {witnesses.map((witness, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{witness.name}</span>
                          <Badge variant="outline">Witness</Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveWitness(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="witnessContact">Contact</Label>
                    <Popover open={witnessContactOpen} onOpenChange={setWitnessContactOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={witnessContactOpen}
                          className="w-full justify-between"
                        >
                          {witnessContactId
                            ? users.find((user) => user._id === witnessContactId)?.name
                            : "Select contact..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search by name or ID card number..." />
                          <CommandList>
                            <CommandEmpty>No contact found.</CommandEmpty>
                            <CommandGroup>
                              {users.map((user) => (
                                <CommandItem
                                  key={user._id}
                                  value={`${user.name}-${user.idCardNumber}`}
                                  onSelect={() => {
                                    setWitnessContactId(user._id)
                                    setWitnessContactOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      witnessContactId === user._id ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  {user.name} - {user.area || "N/A"} - {user.idCardNumber || "N/A"}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddWitness}
                    disabled={!witnessContactId}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-4">
              <Label>Documents (Optional)</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  multiple
                  onChange={handleFileChange}
                />
                <p className="text-sm text-gray-500">
                  Upload PDF, JPEG, or PNG files (max 2MB each)
                </p>
              </div>
              {documents.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-custom">
                  {documents.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{file.name}</span>
                        <Badge variant="outline">{file.type}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDocument(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description and Declaration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of the affidavit..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="declaration">Declaration *</Label>
                <Textarea
                  id="declaration"
                  placeholder="I hereby declare that the information provided is true and correct..."
                  value={declaration}
                  onChange={(e) => setDeclaration(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}