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
import { Check, ChevronsUpDown, X, Plus, User, Users, Wallet, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  const [issuerHasWallet, setIssuerHasWallet] = useState<boolean | null>(null)
  const [description, setDescription] = useState("")
  const [declaration, setDeclaration] = useState("")

  // User role state
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

  // Witnesses state
  const [witnesses, setWitnesses] = useState<Array<{ contactId: string; name: string }>>([])

  // Data fetching state
  const [issuers, setIssuers] = useState<User[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Temporary state for selecting parties
  const [issuerOpen, setIssuerOpen] = useState(false)
  const [sellerOpen, setSellerOpen] = useState(false)
  const [buyerOpen, setBuyerOpen] = useState(false)
  const [witnessContactId, setWitnessContactId] = useState("")
  const [witnessContactOpen, setWitnessContactOpen] = useState(false)

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, token])

  const fetchData = async () => {
    setIsLoadingData(true)
    try {
      const response = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (data.success) {
        setIssuers(data.issuers || [])
        setUsers(data.users || [])
        setHasWallet(!!data.currentUser?.walletAddress)
        setInitiatorIdCardNumber(data.currentUser?.idCardNumber || null)
      } else {
        setIssuers([])
        setUsers([])
        setHasWallet(false)
        toast({ title: "Error", description: data.error || "Failed to fetch users", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      setIssuers([])
      setUsers([])
      setHasWallet(false)
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (issuerId) setIssuerHasWallet(!!issuers.find((u) => u._id === issuerId)?.walletAddress)
    else setIssuerHasWallet(null)
  }, [issuerId, issuers])

  useEffect(() => {
    if (sellerId) setSellerHasWallet(!!users.find((u) => u._id === sellerId)?.walletAddress)
    else setSellerHasWallet(null)
  }, [sellerId, users])

  useEffect(() => {
    if (buyerId) setBuyerHasWallet(!!users.find((u) => u._id === buyerId)?.walletAddress)
    else setBuyerHasWallet(null)
  }, [buyerId, users])

  useEffect(() => {
    const selectedCategory = categories.find((cat) => cat.id === category)
    setStampValue(selectedCategory ? selectedCategory.stampValue : "")
    setDetails({})
  }, [category])

  useEffect(() => {
    if (!open) resetForm()
  }, [open])

  const resetForm = () => {
    setTitle("")
    setCategory("")
    setStampValue("")
    setIssuerId("")
    setIssuerHasWallet(null)
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
      if (contact && !witnesses.some((w) => w.contactId === witnessContactId)) {
        setWitnesses([...witnesses, { contactId: witnessContactId, name: contact.name }])
        setWitnessContactId("")
      } else {
        toast({ title: "Duplicate", description: "Contact already added", variant: "destructive" })
      }
    }
  }

  const handleRemoveWitness = (index: number) => {
    setWitnesses(witnesses.filter((_, i) => i !== index))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({ title: "Invalid Type", description: "Only PDF, JPEG, PNG allowed", variant: "destructive" })
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "Too Large", description: "Max 2MB per file", variant: "destructive" })
        return false
      }
      return true
    })
    setDocuments([...documents, ...validFiles])
  }

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index))
  }

  const handleDetailChange = (name: string, value: string | number) => {
    setDetails((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!title || !category || !issuerId || !userRole || !description || !declaration) return toast({ title: "Error", description: "Fill all required fields", variant: "destructive" })
    if (userRole === "Buyer" && !sellerId) return toast({ title: "Error", description: "Select a Seller", variant: "destructive" })
    if (userRole === "Seller" && !buyerId) return toast({ title: "Error", description: "Select a Buyer", variant: "destructive" })

    const currentFields = categoryFields[category] || []
    if (currentFields.some((field) => field.required && !details[field.name])) return toast({ title: "Error", description: "Fill required category fields", variant: "destructive" })

    if (issuerHasWallet === false) return toast({ title: "Error", description: "Issuer needs a wallet", variant: "destructive" })
    if (userRole === "Buyer" && sellerHasWallet === false) return toast({ title: "Error", description: "Seller needs a wallet", variant: "destructive" })
    if (userRole === "Seller" && buyerHasWallet === false) return toast({ title: "Error", description: "Buyer needs a wallet", variant: "destructive" })

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
      documents.forEach((file) => formData.append("documents", file))

      const response = await fetch("/api/affidavits/affidavit-requests/create", { method: "POST", body: formData, headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const result = await response.json()
      if (result.success) {
        const issuerName = issuers.find((issuer) => issuer._id === issuerId)?.name || "the issuer"
        toast({ title: "Success", description: `Request sent to ${issuerName}`, variant: "default" })
        onOpenChange(false)
      } else {
        toast({ title: "Error", description: result.error || "Failed to submit", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error submitting affidavit:", error)
      toast({ title: "Error", description: "Unexpected error", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter issuers: Only users with "Issuer" role, excluding the current user
  const availableIssuers = issuers.filter((issuer) => issuer._id !== user?._id && issuer.roles.includes("Issuer"))

  // Filter users for seller and buyer: Exclude current user, issuer, and each other
  const availableUsersForSeller = users.filter((u) => u._id !== user?._id && u._id !== issuerId && u._id !== buyerId)
  const availableUsersForBuyer = users.filter((u) => u._id !== user?._id && u._id !== issuerId && u._id !== sellerId)

  // Filter users for witnesses: Exclude current user, issuer, seller, and buyer
  const availableUsersForWitnesses = users.filter(
    (u) => u._id !== user?._id && u._id !== issuerId && u._id !== sellerId && u._id !== buyerId
  )

  if (isLoadingData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>Request New Affidavit</DialogTitle></DialogHeader>
          <div className="flex-1 flex items-center justify-center"><p>Loading...</p></div>
        </DialogContent>
      </Dialog>
    )
  }

  if (hasWallet === false) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>Request New Affidavit</DialogTitle><DialogDescription>Connect a wallet to proceed.</DialogDescription></DialogHeader>
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Wallet className="h-12 w-12 text-gray-500" />
            <p className="text-center text-gray-600">Please connect a wallet.</p>
            <Button onClick={() => router.push("/dashboard/settings")}>Connect Wallet</Button>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Request New Affidavit</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Fill in the details below to request a new affidavit. <span className="text-red-500">*</span> indicates required fields.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          <div className="space-y-6 py-6">
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Basic Information</h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title" className="flex items-center text-gray-700 dark:text-gray-300">
                    Title <span className="text-red-500 ml-1">*</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger><Info className="h-4 w-4 ml-1 text-gray-400" /></TooltipTrigger>
                        <TooltipContent>
                          <p>A concise title for your affidavit (e.g., Property Transfer).</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input id="title" placeholder="e.g., Property Transfer Deed" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" />
                </div>

                <div>
                  <Label htmlFor="category" className="flex items-center text-gray-700 dark:text-gray-300">
                    Category <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {category && (
                  <div>
                    <Label htmlFor="stampValue" className="text-gray-700 dark:text-gray-300">Stamp Value (INR)</Label>
                    <Input id="stampValue" value={stampValue} disabled className="w-full bg-gray-100 dark:bg-gray-700" />
                  </div>
                )}

                <div>
                  <Label htmlFor="issuer" className="flex items-center text-gray-700 dark:text-gray-300">
                    Issuer <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Popover open={issuerOpen} onOpenChange={setIssuerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={issuerOpen} className="w-full justify-between">
                        {issuerId ? availableIssuers.find((issuer) => issuer._id === issuerId)?.name : "Select issuer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search by name or ID..." />
                        <CommandList>
                          <CommandEmpty>No issuer found.</CommandEmpty>
                          <CommandGroup>
                            {availableIssuers.map((issuer) => (
                              <CommandItem key={issuer._id} value={`${issuer.name}-${issuer.idCardNumber}`} onSelect={() => { setIssuerId(issuer._id); setIssuerOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", issuerId === issuer._id ? "opacity-100" : "opacity-0")} />
                                {issuer.name} - {issuer.area || "N/A"} - {issuer.idCardNumber || "N/A"}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {issuerHasWallet === false && <p className="text-red-500 text-sm mt-1">Issuer has no connected wallet.</p>}
                </div>
              </div>
            </div>

            {/* Dynamic Fields */}
            {category && categoryFields[category] && (
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">{category.charAt(0).toUpperCase() + category.slice(1)} Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {categoryFields[category].map((field) => (
                    <div key={field.name}>
                      <Label htmlFor={field.name} className="flex items-center text-gray-700 dark:text-gray-300">
                        {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.type === "select" ? (
                        <Select value={details[field.name]?.toString() || ""} onValueChange={(value) => handleDetailChange(field.name, value)}>
                          <SelectTrigger id={field.name} className="w-full">
                            <SelectValue placeholder={`Select ${field.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.name === "propertyType" && propertyTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input id={field.name} type={field.type} placeholder={`Enter ${field.label}`} value={details[field.name] || ""} onChange={(e) => handleDetailChange(field.name, field.type === "number" ? Number(e.target.value) : e.target.value)} className="w-full" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Role */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Your Role</h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="userRole" className="flex items-center text-gray-700 dark:text-gray-300">
                    Your Role <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={userRole} onValueChange={setUserRole}>
                    <SelectTrigger id="userRole" className="w-full">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Seller">Seller</SelectItem>
                      <SelectItem value="Buyer">Buyer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {userRole === "Buyer" && (
                  <div>
                    <Label htmlFor="seller" className="flex items-center text-gray-700 dark:text-gray-300">
                      Seller <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Popover open={sellerOpen} onOpenChange={setSellerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={sellerOpen} className="w-full justify-between">
                          {sellerId ? availableUsersForSeller.find((u) => u._id === sellerId)?.name : "Select seller..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search by name or ID..." />
                          <CommandList>
                            <CommandEmpty>No user found.</CommandEmpty>
                            <CommandGroup>
                              {availableUsersForSeller.map((user) => (
                                <CommandItem key={user._id} value={`${user.name}-${user.idCardNumber}`} onSelect={() => { setSellerId(user._id); setSellerOpen(false); }}>
                                  <Check className={cn("mr-2 h-4 w-4", sellerId === user._id ? "opacity-100" : "opacity-0")} />
                                  {user.name} - {user.area || "N/A"} - {user.idCardNumber || "N/A"}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {sellerHasWallet === false && <p className="text-red-500 text-sm mt-1">Seller has no connected wallet.</p>}
                  </div>
                )}

                {userRole === "Seller" && (
                  <div>
                    <Label htmlFor="buyer" className="flex items-center text-gray-700 dark:text-gray-300">
                      Buyer <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Popover open={buyerOpen} onOpenChange={setBuyerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={buyerOpen} className="w-full justify-between">
                          {buyerId ? availableUsersForBuyer.find((u) => u._id === buyerId)?.name : "Select buyer..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search by name or ID..." />
                          <CommandList>
                            <CommandEmpty>No user found.</CommandEmpty>
                            <CommandGroup>
                              {availableUsersForBuyer.map((user) => (
                                <CommandItem key={user._id} value={`${user.name}-${user.idCardNumber}`} onSelect={() => { setBuyerId(user._id); setBuyerOpen(false); }}>
                                  <Check className={cn("mr-2 h-4 w-4", buyerId === user._id ? "opacity-100" : "opacity-0")} />
                                  {user.name} - {user.area || "N/A"} - {user.idCardNumber || "N/A"}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {buyerHasWallet === false && <p className="text-red-500 text-sm mt-1">Buyer has no connected wallet.</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Witnesses */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Witnesses (Optional)</h3>
              <div className="space-y-4">
                {witnesses.length > 0 && (
                  <div className="grid gap-2">
                    {witnesses.map((witness, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-md shadow-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">{witness.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveWitness(index)}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Popover open={witnessContactOpen} onOpenChange={setWitnessContactOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={witnessContactOpen} className="w-full justify-between">
                        {witnessContactId ? availableUsersForWitnesses.find((u) => u._id === witnessContactId)?.name : "Select witness..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search by name or ID..." />
                        <CommandList>
                          <CommandEmpty>No contact found.</CommandEmpty>
                          <CommandGroup>
                            {availableUsersForWitnesses.map((user) => (
                              <CommandItem key={user._id} value={`${user.name}-${user.idCardNumber}`} onSelect={() => { setWitnessContactId(user._id); setWitnessContactOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", witnessContactId === user._id ? "opacity-100" : "opacity-0")} />
                                {user.name} - {user.area || "N/A"} - {user.idCardNumber || "N/A"}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button variant="outline" size="icon" onClick={handleAddWitness} disabled={!witnessContactId}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Documents (Optional)</h3>
              <div className="space-y-4">
                <div>
                  <Input type="file" accept="image/jpeg,image/png,application/pdf" multiple onChange={handleFileChange} className="w-full" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Max 2MB per file (PDF, JPEG, PNG)</p>
                </div>
                {documents.length > 0 && (
                  <div className="grid gap-2">
                    {documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-md shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{file.name}</span>
                          <Badge variant="outline" className="text-gray-600 dark:text-gray-400">{file.type}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveDocument(index)}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description and Declaration */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Additional Information</h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="description" className="flex items-center text-gray-700 dark:text-gray-300">
                    Description <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea id="description" placeholder="Detailed description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full" />
                </div>
                <div>
                  <Label htmlFor="declaration" className="flex items-center text-gray-700 dark:text-gray-300">
                    Declaration <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea id="declaration" placeholder="I declare that..." value={declaration} onChange={(e) => setDeclaration(e.target.value)} rows={4} className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}