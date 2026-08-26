"use client"

import { useState, useEffect } from "react"
import { Plus, Download, TrendingUp, ShoppingCart, DollarSign, Users, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminSearch, matchesSearch } from "@/components/admin-search"
import { AdminLoading, useAdminLoader } from "@/components/admin-loading"
import { 
  fetchPurchases, 
  fetchSales, 
  fetchVendors, 
  fetchStaff,
  createPurchase,
  createSale,
  createVendor,
  createStaff
} from "@/lib/api"

interface Purchase {
  id: number
  invoiceNo: string
  vendorName: string
  purchaseDate: string
  month: string
  subtotal: number
  vatAmount: number
  nonVatAmount: number
  total: number
  paymentMode: string
  paymentStatus: string
}

interface Sale {
  id: number
  staffName: string
  saleDate: string
  month: string
  subtotal: number
  vatAmount: number
  total: number
  paymentMode: string
  category?: string
}

interface Vendor {
  id: number
  name: string
  phone?: string
}

interface Staff {
  id: number
  name: string
  role?: string
}

const nepaliMonths = ["Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"]

export default function FinancialReports() {
  const [activeTab, setActiveTab] = useState<"purchases" | "sales">("purchases")
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false)
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false)
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false)
  const { loading, run } = useAdminLoader()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await run(async () => {
        const [purchasesData, salesData, vendorsData, staffData] = await Promise.all([
          fetchPurchases(),
          fetchSales(),
          fetchVendors(),
          fetchStaff()
        ])
        setPurchases(purchasesData)
        setSales(salesData)
        setVendors(vendorsData)
        setStaff(staffData)
      })
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  // Filter purchases by month
  const filteredPurchases = selectedMonth && selectedMonth !== "all"
    ? purchases.filter(p => p.month === selectedMonth)
    : purchases

  // Filter sales by month
  const filteredSales = selectedMonth && selectedMonth !== "all"
    ? sales.filter(s => s.month === selectedMonth)
    : sales

  const visiblePurchases = filteredPurchases.filter((p) =>
    matchesSearch(searchQuery, p.invoiceNo, p.vendorName, p.paymentMode, p.paymentStatus)
  )
  const visibleSales = filteredSales.filter((s) =>
    matchesSearch(searchQuery, s.staffName, s.paymentMode, s.category)
  )

  // Purchase statistics by vendor
  const purchasesByVendor = filteredPurchases.reduce((acc, p) => {
    if (!acc[p.vendorName]) {
      acc[p.vendorName] = {
        vendorName: p.vendorName,
        totalPurchase: 0,
        totalVAT: 0,
        nonVatPurchase: 0,
        totalSales: 0
      }
    }
    acc[p.vendorName].totalPurchase += p.subtotal
    acc[p.vendorName].totalVAT += p.vatAmount
    acc[p.vendorName].nonVatPurchase += p.nonVatAmount
    acc[p.vendorName].totalSales += p.total
    return acc
  }, {} as Record<string, any>)

  // Sales statistics by staff
  const salesByStaff = filteredSales.reduce((acc, s) => {
    if (!acc[s.staffName]) {
      acc[s.staffName] = {
        staffName: s.staffName,
        totalSales: 0,
        totalVAT: 0,
        totalWithVAT: 0
      }
    }
    acc[s.staffName].totalSales += s.subtotal
    acc[s.staffName].totalVAT += s.vatAmount
    acc[s.staffName].totalWithVAT += s.total
    return acc
  }, {} as Record<string, any>)

  // Calculate totals
  const totalPurchaseAmount = filteredPurchases.reduce((sum, p) => sum + p.subtotal, 0)
  const totalPurchaseVAT = filteredPurchases.reduce((sum, p) => sum + p.vatAmount, 0)
  const totalNonVatPurchase = filteredPurchases.reduce((sum, p) => sum + p.nonVatAmount, 0)
  const totalPurchaseWithVAT = filteredPurchases.reduce((sum, p) => sum + p.total, 0)

  const totalSalesAmount = filteredSales.reduce((sum, s) => sum + s.subtotal, 0)
  const totalSalesVAT = filteredSales.reduce((sum, s) => sum + s.vatAmount, 0)
  const totalSalesWithVAT = filteredSales.reduce((sum, s) => sum + s.total, 0)

  const handleAddPurchase = async (data: any) => {
    try {
      await createPurchase(data)
      await loadData()
      setIsPurchaseDialogOpen(false)
    } catch (error) {
      console.error('Failed to add purchase:', error)
      alert('Failed to add purchase')
    }
  }

  const handleAddSale = async (data: any) => {
    try {
      await createSale(data)
      await loadData()
      setIsSaleDialogOpen(false)
    } catch (error) {
      console.error('Failed to add sale:', error)
      alert('Failed to add sale')
    }
  }

  const handleAddVendor = async (data: any) => {
    try {
      await createVendor(data)
      await loadData()
      setIsVendorDialogOpen(false)
    } catch (error) {
      console.error('Failed to add vendor:', error)
      alert('Failed to add vendor')
    }
  }

  const handleAddStaff = async (data: any) => {
    try {
      await createStaff(data)
      await loadData()
      setIsStaffDialogOpen(false)
    } catch (error) {
      console.error('Failed to add staff:', error)
      alert('Failed to add staff')
    }
  }

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(h => row[h]).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${filename}.csv`
    link.click()
  }

  if (loading) return <AdminLoading label="Loading financial reports..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Financial Reports</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <AdminSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search vendor, invoice, staff..."
            className="sm:w-64"
          />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {nepaliMonths.map(month => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="purchases">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Purchase Reports
          </TabsTrigger>
          <TabsTrigger value="sales">
            <DollarSign className="w-4 h-4 mr-2" />
            Sales Reports
          </TabsTrigger>
        </TabsList>

        {/* PURCHASES TAB */}
        <TabsContent value="purchases" className="space-y-6 mt-6">
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsVendorDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
            <Button onClick={() => setIsPurchaseDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Purchase
            </Button>
            <Button variant="outline" onClick={() => exportToCSV(Object.values(purchasesByVendor), `purchases_${selectedMonth === "all" ? "all" : selectedMonth}`)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Purchase Summary Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Purchase</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">NPR {totalPurchaseAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">VAT</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">NPR {totalPurchaseVAT.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Non-VAT Purchase</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">NPR {totalNonVatPurchase.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">NPR {totalPurchaseWithVAT.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Purchase by Vendor Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Summary by Vendor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-700 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Vendor Name</th>
                      <th className="px-4 py-3 text-right">Purchase</th>
                      <th className="px-4 py-3 text-right">VAT</th>
                      <th className="px-4 py-3 text-right">Non VAT Purchase</th>
                      <th className="px-4 py-3 text-right">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(purchasesByVendor).map((vendor: any, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-cyan-200" : "bg-white"}>
                        <td className="px-4 py-3">{vendor.vendorName}</td>
                        <td className="px-4 py-3 text-right font-semibold">{vendor.totalPurchase.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{vendor.totalVAT.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{vendor.nonVatPurchase.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold bg-orange-300">{vendor.totalSales.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-200 font-bold">
                      <td className="px-4 py-3">TOTAL</td>
                      <td className="px-4 py-3 text-right">{totalPurchaseAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{totalPurchaseVAT.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{totalNonVatPurchase.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right bg-orange-300">{totalPurchaseWithVAT.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Purchase Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Transactions ({visiblePurchases.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">S.N.</th>
                      <th className="px-4 py-3 text-left">Month</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Inv No.</th>
                      <th className="px-4 py-3 text-left">Vendor</th>
                      <th className="px-4 py-3 text-left">Payment Mode</th>
                      <th className="px-4 py-3 text-right">Sale</th>
                      <th className="px-4 py-3 text-right">VAT</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePurchases.map((purchase, idx) => (
                      <tr key={purchase.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{idx + 1}</td>
                        <td className="px-4 py-3">{purchase.month}</td>
                        <td className="px-4 py-3">{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{purchase.invoiceNo}</td>
                        <td className="px-4 py-3">{purchase.vendorName}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{purchase.paymentMode}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">{purchase.subtotal.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{purchase.vatAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold">{purchase.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SALES TAB */}
        <TabsContent value="sales" className="space-y-6 mt-6">
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsStaffDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
            <Button onClick={() => setIsSaleDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Sale
            </Button>
            <Button variant="outline" onClick={() => exportToCSV(Object.values(salesByStaff), `sales_${selectedMonth === "all" ? "all" : selectedMonth}`)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Sales Summary Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">NPR {totalSalesAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">VAT</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">NPR {totalSalesVAT.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Sales (with VAT)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">NPR {totalSalesWithVAT.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sales by Staff Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Summary by Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-700 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Column 1</th>
                      <th className="px-4 py-3 text-right">Sales</th>
                      <th className="px-4 py-3 text-right">VAT</th>
                      <th className="px-4 py-3 text-right">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(salesByStaff).map((staffMember: any, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-cyan-200" : "bg-white"}>
                        <td className="px-4 py-3">{staffMember.staffName}</td>
                        <td className="px-4 py-3 text-right font-semibold">{staffMember.totalSales.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{staffMember.totalVAT.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold bg-orange-300">{staffMember.totalWithVAT.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-200 font-bold">
                      <td className="px-4 py-3">TOTAL</td>
                      <td className="px-4 py-3 text-right">{totalSalesAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{totalSalesVAT.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right bg-orange-300">{totalSalesWithVAT.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Sales Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Transactions ({visibleSales.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">S.N.</th>
                      <th className="px-4 py-3 text-left">Month</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Staff</th>
                      <th className="px-4 py-3 text-left">Payment Mode</th>
                      <th className="px-4 py-3 text-right">Sales</th>
                      <th className="px-4 py-3 text-right">VAT</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSales.map((sale, idx) => (
                      <tr key={sale.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{idx + 1}</td>
                        <td className="px-4 py-3">{sale.month}</td>
                        <td className="px-4 py-3">{new Date(sale.saleDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{sale.staffName}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{sale.paymentMode}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">{sale.subtotal.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{sale.vatAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold">{sale.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Purchase Dialog */}
      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Purchase</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const vendor = vendors.find(v => v.id === parseInt(formData.get("vendorId") as string))
            handleAddPurchase({
              invoiceNo: formData.get("invoiceNo"),
              vendorId: parseInt(formData.get("vendorId") as string),
              vendorName: vendor?.name,
              purchaseDate: formData.get("purchaseDate"),
              month: formData.get("month"),
              dateBS: formData.get("dateBS"),
              subtotal: parseFloat(formData.get("subtotal") as string),
              vatPercent: parseFloat(formData.get("vatPercent") as string),
              nonVatAmount: parseFloat(formData.get("nonVatAmount") as string) || 0,
              paymentMode: formData.get("paymentMode"),
              paymentStatus: formData.get("paymentStatus"),
              category: formData.get("category"),
              description: formData.get("description")
            })
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice No *</Label>
                <Input name="invoiceNo" required />
              </div>
              <div className="space-y-2">
                <Label>Vendor *</Label>
                <Select name="vendorId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>{vendor.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Purchase Date *</Label>
                <Input name="purchaseDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label>Month *</Label>
                <Select name="month" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nepaliMonths.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date (BS)</Label>
                <Input name="dateBS" placeholder="2082/05/22" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Subtotal (NPR) *</Label>
                <Input name="subtotal" type="number" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label>VAT % *</Label>
                <Input name="vatPercent" type="number" step="0.01" defaultValue="13" required />
              </div>
              <div className="space-y-2">
                <Label>Non-VAT Amount</Label>
                <Input name="nonVatAmount" type="number" step="0.01" defaultValue="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Mode *</Label>
                <Select name="paymentMode" defaultValue="CREDIT" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">CASH</SelectItem>
                    <SelectItem value="CREDIT">CREDIT</SelectItem>
                    <SelectItem value="CARD">CARD</SelectItem>
                    <SelectItem value="BANK">BANK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Status *</Label>
                <Select name="paymentStatus" defaultValue="unpaid" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Input name="category" placeholder="Food, Beverages, Supplies, etc." />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input name="description" />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPurchaseDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Add Purchase</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Sale Dialog */}
      <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Sale</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const staffMember = staff.find(s => s.id === parseInt(formData.get("staffId") as string))
            handleAddSale({
              staffId: parseInt(formData.get("staffId") as string),
              staffName: staffMember?.name,
              saleDate: formData.get("saleDate"),
              month: formData.get("month"),
              dateBS: formData.get("dateBS"),
              subtotal: parseFloat(formData.get("subtotal") as string),
              vatPercent: parseFloat(formData.get("vatPercent") as string),
              nonVatAmount: parseFloat(formData.get("nonVatAmount") as string) || 0,
              paymentMode: formData.get("paymentMode"),
              category: formData.get("category"),
              description: formData.get("description"),
              invoiceNo: formData.get("invoiceNo"),
              customerName: formData.get("customerName")
            })
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Staff *</Label>
                <Select name="staffId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map(member => (
                      <SelectItem key={member.id} value={member.id.toString()}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice No</Label>
                <Input name="invoiceNo" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sale Date *</Label>
                <Input name="saleDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label>Month *</Label>
                <Select name="month" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nepaliMonths.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date (BS)</Label>
                <Input name="dateBS" placeholder="2082/05/22" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Subtotal (NPR) *</Label>
                <Input name="subtotal" type="number" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label>VAT % *</Label>
                <Input name="vatPercent" type="number" step="0.01" defaultValue="13" required />
              </div>
              <div className="space-y-2">
                <Label>Non-VAT Amount</Label>
                <Input name="nonVatAmount" type="number" step="0.01" defaultValue="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Mode *</Label>
                <Select name="paymentMode" defaultValue="CASH" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">CASH</SelectItem>
                    <SelectItem value="CREDIT">CREDIT</SelectItem>
                    <SelectItem value="CARD">CARD</SelectItem>
                    <SelectItem value="QR">QR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input name="category" placeholder="Room, Food, Beverage, etc." />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input name="customerName" />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input name="description" />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsSaleDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Add Sale</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Vendor Dialog */}
      <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vendor</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            handleAddVendor({
              name: formData.get("name"),
              contactPerson: formData.get("contactPerson"),
              phone: formData.get("phone"),
              email: formData.get("email"),
              address: formData.get("address"),
              panNumber: formData.get("panNumber"),
              notes: formData.get("notes")
            })
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Vendor Name *</Label>
              <Input name="name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input name="contactPerson" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" type="tel" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input name="address" />
            </div>
            <div className="space-y-2">
              <Label>PAN Number</Label>
              <Input name="panNumber" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input name="notes" />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsVendorDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Add Vendor</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            handleAddStaff({
              name: formData.get("name"),
              role: formData.get("role")
            })
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Staff Name *</Label>
              <Input name="name" required />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input name="role" placeholder="Manager, Waiter, Receptionist, etc." />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsStaffDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Add Staff</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
