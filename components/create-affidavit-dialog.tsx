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

export default function CreateAffidavitDialog({ open, onOpenChange }: CreateAffidavitDialogProps) {
  const router = useRouter()
  const { token, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasWallet, setHasWallet] = useState<boolean | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [stampValue, setStampValue] = useState("")
  const [issuerId, setIssuerId] = useState("")
  const [description, setDescription] = useState("")
  const [declaration, setDeclaration] = useState("")

  // User role state (Seller/Buyer)
  const [userRole, setUserRole] = useState("")
  const [sellerId, setSellerId] = useState("")
  const [buyerId, setBuyerId] = useState("")

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
      checkWallet()
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
        const fetchedIssuers = data.users.filter((user: User) =>
          user.roles.includes("Issuer")
        )
        const fetchedUsers = data.users.filter((user: User) =>
          user.roles.includes("User")
        )
        setIssuers(fetchedIssuers)
        setUsers(fetchedUsers)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching users",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const checkWallet = async () => {
    try {
      if (user && user.walletAddress) {
        setHasWallet(true)
        return
      }

      const userResponse = await fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!userResponse.ok) {
        throw new Error(`HTTP error! status: ${userResponse.status}`)
      }
      const userData = await userResponse.json()
      if (userData.success) {
        const currentUser = userData.users.find((u: User) => u._id === user?._id)
        if (currentUser) {
          setHasWallet(!!currentUser?.walletAddress)
          console.log("Current user wallet address:", currentUser?.walletAddress)
        } else {
          setHasWallet(false)
          toast({
            title: "Error",
            description: "Current user not found",
            variant: "destructive",
          })
        }
      } else {
        setHasWallet(false)
        toast({
          title: "Error",
          description: userData.error || "Failed to fetch user data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error verifying wallet:", error)
      setHasWallet(false)
      toast({
        title: "Error",
        description: "An error occurred while verifying wallet status",
        variant: "destructive",
      })
    }
  }

  // Update stamp value when category changes
  useEffect(() => {
    const selectedCategory = categories.find((cat) => cat.id === category)
    setStampValue(selectedCategory ? selectedCategory.stampValue : "")
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
    setDescription("")
    setDeclaration("")
    setUserRole("")
    setSellerId("")
    setBuyerId("")
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

  const handleSubmit = () => {
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

    toast({
      title: "Success",
      description: "Affidavit request submitted successfully (front-end demo).",
    })
    onOpenChange(false)
  }

  // Filter out the current user from the list of selectable users for Seller/Buyer
  const availableUsers = users.filter((u) => u._id !== user?._id)

  // Determine if the user selected themselves as the seller
  const isUserSeller = userRole === "Seller"

  // If wallet check is still loading or data is loading, show a loading state
  if (hasWallet === null || isLoadingData) {
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
  if (!hasWallet) {
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
              Please connect wallet before proceeding or you have to connect wallet to request for affidavit.
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
              </div>
            </div>

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