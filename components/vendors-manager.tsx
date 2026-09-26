"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Truck } from "lucide-react"
import { fetchVendors, createVendor, updateVendor, deleteVendor } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AdminSearch, matchesSearch } from "@/components/admin-search"
import { AdminLoading, useAdminLoader } from "@/components/admin-loading"

interface Vendor {
  id: number
  name: string
  irdNumber?: string | null
  address?: string | null
  phone?: string | null
  active: boolean
  _count?: { purchases: number }
}

const emptyForm = {
  name: "",
  irdNumber: "",
  address: "",
  phone: "",
}

export default function VendorsManager() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState(emptyForm)
  const { loading, run } = useAdminLoader()

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      await run(async () => {
        const data = await fetchVendors()
        setVendors(data)
      })
    } catch (error) {
      console.error("Failed to load vendors:", error)
      alert("Failed to load vendors")
    }
  }

  const handleOpenDialog = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor)
      setFormData({
        name: vendor.name,
        irdNumber: vendor.irdNumber || "",
        address: vendor.address || "",
        phone: vendor.phone || "",
      })
    } else {
      setEditingVendor(null)
      setFormData(emptyForm)
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert("Vendor name is required")
      return
    }

    try {
      if (editingVendor) {
        await updateVendor(editingVendor.id, formData)
      } else {
        await createVendor(formData)
      }
      await loadVendors()
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Failed to save vendor:", error)
      alert(error.message || "Failed to save vendor")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Delete this vendor?")) {
      try {
        await deleteVendor(id)
        await loadVendors()
      } catch (error: any) {
        console.error("Failed to delete vendor:", error)
        alert(error.message || "Failed to delete vendor")
      }
    }
  }

  if (loading) return <AdminLoading label="Loading vendors..." />

  const filteredVendors = vendors.filter((vendor) =>
    matchesSearch(searchQuery, vendor.name, vendor.irdNumber, vendor.address, vendor.phone)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Vendors List</h2>
          <p className="text-sm text-muted-foreground">Manage suppliers and vendors</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <AdminSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search vendors, IRD number, address, contact number..."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id} className={!vendor.active ? "opacity-60" : ""}>
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="text-lg">{vendor.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(vendor)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(vendor.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {vendor.phone && (
                <p className="text-sm"><strong>Contact Number:</strong> {vendor.phone}</p>
              )}
              {vendor.irdNumber && (
                <p className="text-sm"><strong>IRD Number:</strong> {vendor.irdNumber}</p>
              )}
              {vendor.address && (
                <p className="text-sm"><strong>Address:</strong> {vendor.address}</p>
              )}
              {vendor._count && (
                <Badge variant="secondary">{vendor._count.purchases} purchases</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {vendors.length === 0 && (
        <p className="text-center text-gray-500 py-6">No vendors added yet.</p>
      )}
      {vendors.length > 0 && filteredVendors.length === 0 && (
        <p className="text-center text-gray-500 py-6">No vendors match "{searchQuery}".</p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="vendor-name">Vendor Name *</Label>
              <Input
                id="vendor-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="vendor-ird">IRD Number</Label>
              <Input
                id="vendor-ird"
                value={formData.irdNumber}
                onChange={(e) => setFormData({ ...formData, irdNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="vendor-contact">Contact Number</Label>
              <Input
                id="vendor-contact"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="vendor-address">Address</Label>
              <Textarea
                id="vendor-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
              />
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
    </div>
  )
}
