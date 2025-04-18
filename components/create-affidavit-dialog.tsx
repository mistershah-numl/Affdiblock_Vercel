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
import { Check, ChevronsUpDown, X, Plus, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createAffidavitRequest } from "@/lib/api/affidavits"

interface CreateAffidavitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock data for categories
const categories = [
  { id: "property", name: "Property" },
  { id: "vehicle", name: "Vehicle" },
  { id: "business", name: "Business" },
  { id: "personal", name: "Personal" },
  { id: "education", name: "Education" },
  { id: "employment", name: "Employment" },
  { id: "legal", name: "Legal" },
  { id: "financial", name: "Financial" },
]

// Mock data for issuers
const issuers = [
  { id: "issuer_1", name: "John Doe", organization: "Doe Legal Services" },
  { id: "issuer_2", name: "Jane Smith", organization: "Smith Legal Consultants" },
  { id: "issuer_3", name: "Robert Johnson", organization: "Johnson Notary Office" },
  { id: "issuer_4", name: "Sarah Williams", organization: "Williams Legal" },
  { id: "issuer_5", name: "Michael Brown", organization: "Brown & Associates" },
]

// Mock data for contacts (potential parties and witnesses)
const contacts = [
  { id: "contact_1", name: "Alice Johnson", email: "alice@example.com", relationship: "Friend" },
  { id: "contact_2", name: "Bob Smith", email: "bob@example.com", relationship: "Colleague" },
  { id: "contact_3", name: "Charlie Brown", email: "charlie@example.com", relationship: "Family" },
  { id: "contact_4", name: "Diana Prince", email: "diana@example.com", relationship: "Business Partner" },
  { id: "contact_5", name: "Edward Norton", email: "edward@example.com", relationship: "Neighbor" },
  { id: "contact_6", name: "Fiona Apple", email: "fiona@example.com", relationship: "Friend" },
  { id: "contact_7", name: "George Lucas", email: "george@example.com", relationship: "Colleague" },
  { id: "contact_8", name: "Hannah Montana", email: "hannah@example.com", relationship: "Family" },
]

export default function CreateAffidavitDialog({ open, onOpenChange }: CreateAffidavitDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [issuerId, setIssuerId] = useState("")
  const [description, setDescription] = useState("")
  const [declaration, setDeclaration] = useState("")

  // Parties and witnesses state
  const [parties, setParties] = useState<Array<{ role: string; contactId: string; name: string }>>([])
  const [witnesses, setWitnesses] = useState<Array<{ contactId: string; name: string }>>([])

  // Temporary state for adding a party
  const [partyRole, setPartyRole] = useState("")
  const [partyContactId, setPartyContactId] = useState("")
  const [partyContactOpen, setPartyContactOpen] = useState(false)

  // Temporary state for adding a witness
  const [witnessContactId, setWitnessContactId] = useState("")
  const [witnessContactOpen, setWitnessContactOpen] = useState(false)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setTitle("")
    setCategory("")
    setIssuerId("")
    setDescription("")
    setDeclaration("")
    setParties([])
    setWitnesses([])
    setPartyRole("")
    setPartyContactId("")
    setWitnessContactId("")
  }

  const handleAddParty = () => {
    if (partyRole && partyContactId) {
      const contact = contacts.find((c) => c.id === partyContactId)
      if (contact) {
        setParties([...parties, { role: partyRole, contactId: partyContactId, name: contact.name }])
        setPartyRole("")
        setPartyContactId("")
      }
    }
  }

  const handleRemoveParty = (index: number) => {
    const updatedParties = [...parties]
    updatedParties.splice(index, 1)
    setParties(updatedParties)
  }

  const handleAddWitness = () => {
    if (witnessContactId) {
      const contact = contacts.find((c) => c.id === witnessContactId)
      if (contact) {
        // Check if witness is already added
        if (!witnesses.some((w) => w.contactId === witnessContactId)) {
          setWitnesses([...witnesses, { contactId: witnessContactId, name: contact.name }])
          setWitnessContactId("")
        }
      }
    }
  }

  const handleRemoveWitness = (index: number) => {
    const updatedWitnesses = [...witnesses]
    updatedWitnesses.splice(index, 1)
    setWitnesses(updatedWitnesses)
  }

  const handleSubmit = async () => {
    if (!title || !category || !issuerId || !description || !declaration || parties.length === 0) {
      // Show validation error
      return
    }

    setIsSubmitting(true)

    try {
      // Format data for API
      const affidavitData = {
        title,
        category,
        issuerId,
        description,
        declaration,
        parties: parties.map((p) => ({ role: p.role, userId: p.contactId })),
        witnesses: witnesses.map((w) => ({ userId: w.contactId })),
        userId: "user_123456789", // In a real app, this would be the current user's ID
      }

      const response = await createAffidavitRequest(affidavitData)

      if (response.success) {
        onOpenChange(false)
        router.push("/dashboard/affidavits")
      } else {
        // Handle error
        console.error("Failed to create affidavit request:", response.error)
      }
    } catch (error) {
      console.error("Error creating affidavit request:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Request New Affidavit</DialogTitle>
          <DialogDescription>
            Fill in the details below to request a new affidavit. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
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

              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer *</Label>
                <Select value={issuerId} onValueChange={setIssuerId}>
                  <SelectTrigger id="issuer">
                    <SelectValue placeholder="Select an issuer" />
                  </SelectTrigger>
                  <SelectContent>
                    {issuers.map((issuer) => (
                      <SelectItem key={issuer.id} value={issuer.id}>
                        {issuer.name} - {issuer.organization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Parties */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Parties *</Label>
                <span className="text-xs text-gray-500 dark:text-gray-400">At least one party is required</span>
              </div>

              <div className="space-y-4">
                {parties.length > 0 && (
                  <div className="space-y-2">
                    {parties.map((party, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{party.name}</span>
                          <Badge variant="outline">{party.role}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveParty(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="partyRole">Role</Label>
                    <Input
                      id="partyRole"
                      placeholder="e.g., Buyer, Seller, Applicant"
                      value={partyRole}
                      onChange={(e) => setPartyRole(e.target.value)}
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label htmlFor="partyContact">Contact</Label>
                    <Popover open={partyContactOpen} onOpenChange={setPartyContactOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={partyContactOpen}
                          className="w-full justify-between"
                        >
                          {partyContactId
                            ? contacts.find((contact) => contact.id === partyContactId)?.name
                            : "Select contact..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search contacts..." />
                          <CommandList>
                            <CommandEmpty>No contact found.</CommandEmpty>
                            <CommandGroup>
                              {contacts.map((contact) => (
                                <CommandItem
                                  key={contact.id}
                                  value={contact.id}
                                  onSelect={(value) => {
                                    setPartyContactId(value === partyContactId ? "" : value)
                                    setPartyContactOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      partyContactId === contact.id ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  {contact.name} - {contact.relationship}
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
                    onClick={handleAddParty}
                    disabled={!partyRole || !partyContactId}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Witnesses */}
            <div className="space-y-4">
              <Label>Witnesses (Optional)</Label>

              <div className="space-y-4">
                {witnesses.length > 0 && (
                  <div className="space-y-2">
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
                            ? contacts.find((contact) => contact.id === witnessContactId)?.name
                            : "Select contact..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search contacts..." />
                          <CommandList>
                            <CommandEmpty>No contact found.</CommandEmpty>
                            <CommandGroup>
                              {contacts.map((contact) => (
                                <CommandItem
                                  key={contact.id}
                                  value={contact.id}
                                  onSelect={(value) => {
                                    setWitnessContactId(value === witnessContactId ? "" : value)
                                    setWitnessContactOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      witnessContactId === contact.id ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  {contact.name} - {contact.relationship}
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
