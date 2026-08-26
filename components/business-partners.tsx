"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Upload, Building2, FileSpreadsheet, Download, DollarSign } from "lucide-react"
import { fetchBusinesses, createBusiness, updateBusiness, deleteBusiness, importBusinesses } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import RateCardManager from "./rate-card-manager"
import { AdminSearch, matchesSearch } from "@/components/admin-search"
import * as XLSX from "xlsx"

interface Business {
  id: number
  name: string
  contactPerson?: string | null
  phone: string
  email?: string | null
  address?: string | null
  irdNumber?: string | null
  creditLimit?: number
  currentCredit: number
  notes?: string | null
  active: boolean
  _count?: { bookings: number }
}

export default function BusinessPartners() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isBookingImportOpen, setIsBookingImportOpen] = useState(false)
  const [importData, setImportData] = useState("")
  const [businessImportFile, setBusinessImportFile] = useState<File | null>(null)
  const [selectedBusinessForImport, setSelectedBusinessForImport] = useState<string>("")
  const [bookingFile, setBookingFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [selectedBusinessForRates, setSelectedBusinessForRates] = useState<Business | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [rooms, setRooms] = useState<any[]>([]) // For room types
  
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    irdNumber: "",
    creditLimit: "0",
    notes: "",
    active: true
  })

  useEffect(() => {
    loadBusinesses()
    loadRooms()
  }, [])

  const loadBusinesses = async () => {
    try {
      const data = await fetchBusinesses()
      setBusinesses(data)
    } catch (error) {
      console.error('Failed to load businesses:', error)
      alert('Failed to load businesses')
    }
  }

  const loadRooms = async () => {
    try {
      const response = await fetch('/api/rooms')
      const data = await response.json()
      setRooms(data)
    } catch (error) {
      console.error('Failed to load rooms:', error)
    }
  }

  const handleOpenDialog = (business?: Business) => {
    if (business) {
      setEditingBusiness(business)
      setFormData({
        name: business.name,
        contactPerson: business.contactPerson || "",
        phone: business.phone,
        email: business.email || "",
        address: business.address || "",
        irdNumber: business.irdNumber || "",
        creditLimit: business.creditLimit?.toString() || "0",
        notes: business.notes || "",
        active: business.active
      })
    } else {
      setEditingBusiness(null)
      setFormData({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        irdNumber: "",
        creditLimit: "0",
        notes: "",
        active: true
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingBusiness) {
        await updateBusiness(editingBusiness.id, formData)
      } else {
        await createBusiness(formData)
      }
      await loadBusinesses()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to save business:', error)
      alert('Failed to save business')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Delete this business partner?")) {
      try {
        await deleteBusiness(id)
        await loadBusinesses()
      } catch (error) {
        console.error('Failed to delete business:', error)
        alert('Failed to delete business')
      }
    }
  }

  const handleImport = async () => {
    if (!importData.trim() && !businessImportFile) {
      alert("Please paste data or upload an Excel file")
      return
    }

    try {
      let businessesToImport: any[] = []

      // If file is uploaded, parse it
      if (businessImportFile) {
        const excelData = await parseExcelFile(businessImportFile)
        console.log("Parsed Excel data:", excelData)
        console.log("First row keys:", excelData[0] ? Object.keys(excelData[0]) : "No data")
        
        // Extract unique companies from the "Company" column (try different variations)
        const uniqueCompanies = new Set<string>()
        excelData.forEach((row: any) => {
          // Try different column name variations
          const company = row.Company || row.company || row.COMPANY || 
                         row["Company"] || row["COMPANY"] || 
                         row[Object.keys(row).find(k => k.toLowerCase().includes('company')) || '']
          
          if (company && typeof company === 'string' && company.trim()) {
            uniqueCompanies.add(company.trim())
          }
        })

        console.log("Unique companies found:", Array.from(uniqueCompanies))

        // Create business objects from unique companies
        businessesToImport = Array.from(uniqueCompanies).map(companyName => ({
          name: companyName,
          contactPerson: null,
          phone: null,
          email: null,
          address: null,
          irdNumber: null,
          creditLimit: 0,
          notes: `Imported from Excel on ${new Date().toLocaleDateString()}`
        }))
      } else {
        // Parse pasted tab-separated data
        const lines = importData.trim().split('\n')
        businessesToImport = lines.slice(1).map(line => {
          const [name, contactPerson, phone, email, address, irdNumber, creditLimit, notes] = line.split('\t')
          return {
            name: name?.trim(),
            contactPerson: contactPerson?.trim() || null,
            phone: phone?.trim() || null,
            email: email?.trim() || null,
            address: address?.trim() || null,
            irdNumber: irdNumber?.trim() || null,
            creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
            notes: notes?.trim() || null
          }
        }).filter(b => b.name)
      }

      if (businessesToImport.length === 0) {
        alert("No valid business data found. Please check:\n1. Your Excel has a 'Company' column\n2. The column contains company names\n3. The file was uploaded correctly")
        return
      }

      console.log("Businesses to import:", businessesToImport)

      const result = await importBusinesses(businessesToImport)
      alert(`${result.message}\n\n${businessesToImport.map(b => `- ${b.name}`).join('\n')}`)
      setIsImportDialogOpen(false)
      setImportData("")
      setBusinessImportFile(null)
      await loadBusinesses()
    } catch (error) {
      console.error('Failed to import businesses:', error)
      alert('Failed to import businesses')
    }
  }

  const downloadBookingTemplate = () => {
    const templateData = [
      {
        "SN": 1,
        "Bill NO": "125",
        "Date": "2025-05-15",
        "Column 13": "John Doe",
        "Company": "ABC Travel",
        "Room Type": "Deluxe",
        "PLAN": "AP",
        "DBL": 36000,
        "SGL": 27000,
        "TRPL": 0,
        "Total": 63000,
        "Amt Before VAT": 55752.21,
        "vat amount": 7247.79
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Bookings")
    XLSX.writeFile(wb, "Business_Booking_Template.xlsx")
  }

  const handleBookingFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setBookingFile(selectedFile)
      setImportResult(null)
    }
  }

  const parseExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: "binary" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // Get the range to find where data starts
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
          
          // Try to find the header row by looking for "Company" column
          let headerRow = -1
          for (let row = range.s.r; row <= Math.min(range.s.r + 10, range.e.r); row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
              const cell = worksheet[cellAddress]
              if (cell && cell.v && typeof cell.v === 'string' && cell.v.toLowerCase().includes('company')) {
                headerRow = row
                break
              }
            }
            if (headerRow !== -1) break
          }
          
          // If header found, use it; otherwise start from row 3 (index 2)
          const startRow = headerRow !== -1 ? headerRow : 2
          
          // Parse with the correct header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            range: startRow,
            defval: null 
          })
          
          console.log("Found header at row:", startRow + 1)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = (error) => reject(error)
      reader.readAsBinaryString(file)
    })
  }

  const handleBookingImport = async () => {
    if (!bookingFile || !selectedBusinessForImport) {
      alert("Please select a business and upload an Excel file")
      return
    }

    try {
      const excelData = await parseExcelFile(bookingFile)

      const response = await fetch("/api/business/import-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBusinessForImport,
          excelData,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setImportResult(data.results)
        alert(`✅ Success! Imported ${data.results.success} bookings.\nTotal: NPR ${data.results.totalAmount.toLocaleString()}`)
        setBookingFile(null)
        setSelectedBusinessForImport("")
        const fileInput = document.getElementById("booking-file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
        await loadBusinesses()
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Import error:", error)
      alert("❌ Failed to import bookings")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Business Partners</h2>
          <p className="text-sm text-muted-foreground">Manage travel offices and business accounts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import Partners
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Business
          </Button>
        </div>
      </div>

      <AdminSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search partners, contact, phone, email..."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {businesses.filter((business) => matchesSearch(searchQuery, business.name, business.contactPerson, business.phone, business.email, business.address, business.irdNumber)).map((business) => (
          <Card key={business.id} className={!business.active ? "opacity-60" : ""}>
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span className="text-lg">{business.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(business)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(business.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {business.contactPerson && (
                <p className="text-sm"><strong>Contact:</strong> {business.contactPerson}</p>
              )}
              <p className="text-sm"><strong>Phone:</strong> {business.phone}</p>
              {business.email && (
                <p className="text-sm"><strong>Email:</strong> {business.email}</p>
              )}
              {business.irdNumber && (
                <p className="text-sm"><strong>IRD:</strong> {business.irdNumber}</p>
              )}
              <div className="flex gap-2 pt-2">
                <Badge variant="secondary">
                  {business._count?.bookings || 0} bookings
                </Badge>
                <Badge variant={business.currentCredit > 0 ? "destructive" : "default"}>
                  Credit: NPR {business.currentCredit.toFixed(2)}
                </Badge>
              </div>
              <Button 
                onClick={() => setSelectedBusinessForRates(business)}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Manage Rate Cards
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {businesses.length > 0 && businesses.filter((business) => matchesSearch(searchQuery, business.name, business.contactPerson, business.phone, business.email, business.address, business.irdNumber)).length === 0 && (
        <p className="text-center text-gray-500 py-6">No partners match “{searchQuery}”.</p>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBusiness ? "Edit Business" : "Add Business"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="irdNumber">IRD Number</Label>
                <Input
                  id="irdNumber"
                  value={formData.irdNumber}
                  onChange={(e) => setFormData({ ...formData, irdNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="creditLimit">Credit Limit (NPR)</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <Label htmlFor="active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Businesses from Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload your billing Excel file with columns: <strong>SN, Bill NO, Date, Column 13, Company, Room Type, PLAN, DBL, SGL, TRPL, Total, Amt Before VAT, vat amount</strong>
              <br />
              The system will automatically extract unique companies from the "Company" column and create business partners.
            </p>
            
            {/* File Upload Option */}
            <div className="space-y-2 p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
              <Label className="font-semibold">Upload Your Billing Excel File</Label>
              <input
                id="business-file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setBusinessImportFile(file)
                    setImportData("") // Clear paste data if file is uploaded
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
              />
              {businessImportFile && (
                <p className="text-sm text-green-600 font-semibold">✓ Selected: {businessImportFile.name}</p>
              )}
              <p className="text-xs text-gray-600 mt-2">
                💡 The system will extract all unique company names and create business partners. You can update phone numbers later.
              </p>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-sm text-gray-500 font-semibold">OR (Advanced)</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Paste Option */}
            <div className="space-y-2">
              <Label className="font-semibold">Manually Paste Business Data</Label>
              <p className="text-xs text-gray-600">Format: Name, Contact Person, Phone, Email, Address, IRD Number, Credit Limit, Notes (tab-separated)</p>
              <Textarea
                value={importData}
                onChange={(e) => {
                  setImportData(e.target.value)
                  if (e.target.value.trim()) {
                    setBusinessImportFile(null) // Clear file if data is pasted
                  }
                }}
                placeholder="Paste tab-separated business data here (optional)..."
                rows={6}
                className="border-green-300"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsImportDialogOpen(false)
                setImportData("")
                setBusinessImportFile(null)
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!importData.trim() && !businessImportFile}
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rate Card Manager Dialog */}
      {selectedBusinessForRates && (
        <Dialog open={!!selectedBusinessForRates} onOpenChange={() => setSelectedBusinessForRates(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rate Cards - {selectedBusinessForRates.name}</DialogTitle>
            </DialogHeader>
            <RateCardManager 
              businessId={selectedBusinessForRates.id}
              businessName={selectedBusinessForRates.name}
              roomTypes={rooms.map(r => r.name)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
