"use client"

import { useEffect, useState } from "react"
import { Download, ShoppingCart, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminSearch, matchesSearch } from "@/components/admin-search"
import { AdminLoading, AdminRefreshHint, useAdminLoader } from "@/components/admin-loading"
import { adToBs, bsMonthIndex, nepaliMonths } from "@/lib/nepali-date"
import { fetchAccountTransactions, fetchVendors } from "@/lib/api"

interface Vendor {
  id: number
  name: string
}

interface Transaction {
  id: number
  date: string
  type: "income" | "expense"
  category: string
  description: string
  amount: number
  currency: string
  paymentMethod: string
  partyName?: string | null
  invoiceNo?: string | null
  taxPercentage?: number | null
  taxAmount?: number | null
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const CATEGORY_LABELS: Record<string, string> = {
  room_booking: "Room Booking",
  restaurant: "Restaurant",
  bar: "Bar",
  salary: "Salary",
  utilities: "Utilities",
  supplies: "Supplies",
  other: "Other",
}

// Sales Report = income transactions, Purchase Report = expense transactions (both sourced from AMS)
export default function FinancialReports() {
  const [activeTab, setActiveTab] = useState<"purchases" | "sales">("purchases")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [selectedNepaliMonth, setSelectedNepaliMonth] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [selectedVendor, setSelectedVendor] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { loading, refreshing, run } = useAdminLoader()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      await run(async () => {
        const [txnData, vendorData] = await Promise.all([fetchAccountTransactions(), fetchVendors()])
        setTransactions(txnData)
        setVendors(vendorData)
      })
    } catch (error) {
      console.error("Failed to load transactions:", error)
    }
  }

  const txnType: "income" | "expense" = activeTab === "sales" ? "income" : "expense"

  const availableYears = Array.from(
    new Set(transactions.map((t) => new Date(t.date).getFullYear()).filter((y) => !Number.isNaN(y)))
  ).sort((a, b) => b - a)
  if (availableYears.length === 0) availableYears.push(new Date().getFullYear())

  // Filter by tab type, then by month/year, then by search
  const byType = transactions.filter((t) => t.type === txnType)

  const byPeriod = byType.filter((t) => {
    const d = new Date(t.date)
    const monthOk = selectedMonth === "all" || d.getMonth() === parseInt(selectedMonth)
    const nepaliMonthOk = selectedNepaliMonth === "all" || bsMonthIndex(d) === parseInt(selectedNepaliMonth)
    const yearOk = selectedYear === "all" || d.getFullYear() === parseInt(selectedYear)
    const vendorOk = activeTab !== "purchases" || selectedVendor === "all" || t.partyName === selectedVendor
    return monthOk && nepaliMonthOk && yearOk && vendorOk
  })

  const visible = byPeriod
    .filter((t) => matchesSearch(searchQuery, t.description, t.category, t.partyName, t.invoiceNo, t.paymentMethod))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Summary grouping: sales by category, purchases by vendor/party
  const groupKey = (t: Transaction) =>
    activeTab === "sales" ? CATEGORY_LABELS[t.category] || t.category : t.partyName || "Unspecified"

  const summary = byPeriod.reduce((acc, t) => {
    const key = groupKey(t)
    if (!acc[key]) acc[key] = { name: key, subtotal: 0, vat: 0, total: 0 }
    acc[key].subtotal += t.amount
    acc[key].vat += t.taxAmount || 0
    acc[key].total += t.amount + (t.taxAmount || 0)
    return acc
  }, {} as Record<string, { name: string; subtotal: number; vat: number; total: number }>)

  const totalAmount = byPeriod.reduce((sum, t) => sum + t.amount, 0)
  const totalVAT = byPeriod.reduce((sum, t) => sum + (t.taxAmount || 0), 0)
  const totalNonVat = byPeriod.filter((t) => !t.taxPercentage).reduce((sum, t) => sum + t.amount, 0)
  const totalWithVAT = totalAmount + totalVAT

  const exportToCSV = () => {
    const rows = visible.map((t, idx) => ({
      "S.N.": idx + 1,
      Date: new Date(t.date).toLocaleDateString(),
      "Nepali Date": adToBs(t.date),
      [activeTab === "sales" ? "Category" : "Vendor/Party"]: activeTab === "sales" ? (CATEGORY_LABELS[t.category] || t.category) : (t.partyName || "Unspecified"),
      "Invoice No": t.invoiceNo || "",
      Description: t.description,
      "Payment Method": t.paymentMethod,
      Amount: t.amount,
      VAT: t.taxAmount || 0,
      Total: t.amount + (t.taxAmount || 0),
    }))
    if (rows.length === 0) return
    const headers = Object.keys(rows[0])
    const csvContent = [headers.join(","), ...rows.map((row) => headers.map((h) => (row as any)[h]).join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const monthLabel = selectedMonth !== "all"
      ? months[parseInt(selectedMonth)]
      : selectedNepaliMonth !== "all"
        ? nepaliMonths[parseInt(selectedNepaliMonth)]
        : "all-months"
    link.download = `${activeTab}_${selectedYear === "all" ? "all-years" : selectedYear}_${monthLabel}.csv`
    link.click()
  }

  if (loading) return <AdminLoading label="Loading financial reports..." />

  const reportTitle = activeTab === "sales" ? "Sales Report" : "Purchase Report"
  const summaryTitle = activeTab === "sales" ? "Sales Summary by Category" : "Purchase Summary by Vendor"
  const groupColumnLabel = activeTab === "sales" ? "Category" : "Vendor Name"

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold">Financial Reports</h2>
          <AdminRefreshHint show={refreshing} />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <AdminSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search description, category, vendor..."
            className="sm:w-64"
          />
          <Select
            value={selectedMonth}
            onValueChange={(v) => {
              setSelectedMonth(v)
              if (v !== "all") setSelectedNepaliMonth("all")
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Months (AD)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months (AD)</SelectItem>
              {months.map((month, idx) => (
                <SelectItem key={month} value={idx.toString()}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedNepaliMonth}
            onValueChange={(v) => {
              setSelectedNepaliMonth(v)
              if (v !== "all") setSelectedMonth("all")
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Months (BS)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months (BS)</SelectItem>
              {nepaliMonths.map((month, idx) => (
                <SelectItem key={month} value={idx.toString()}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Live reports pulled from the Account Management System (AMS). Add or edit entries from AMS &rarr; Transactions.
      </p>

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

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            {activeTab === "purchases" ? (
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : <span />}
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {activeTab === "sales" ? "Total Sales" : "Total Purchase"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">NPR {totalAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">VAT</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">NPR {totalVAT.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Non-VAT {activeTab === "sales" ? "Sales" : "Purchase"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">NPR {totalNonVat.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total (with VAT)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">NPR {totalWithVAT.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Summary by Category/Vendor */}
          <Card>
            <CardHeader>
              <CardTitle>{summaryTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-700 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">{groupColumnLabel}</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">VAT</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(summary).map((row, idx) => (
                      <tr key={row.name} className={idx % 2 === 0 ? "bg-cyan-200" : "bg-white"}>
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3 text-right font-semibold">{row.subtotal.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{row.vat.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold bg-orange-300">{row.total.toLocaleString()}</td>
                      </tr>
                    ))}
                    {Object.keys(summary).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No {activeTab} recorded for this period.</td>
                      </tr>
                    )}
                    <tr className="bg-gray-200 font-bold">
                      <td className="px-4 py-3">TOTAL</td>
                      <td className="px-4 py-3 text-right">{totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{totalVAT.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right bg-orange-300">{totalWithVAT.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>{reportTitle} &mdash; Transactions ({visible.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">S.N.</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">{groupColumnLabel}</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">Payment Mode</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">VAT</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((t, idx) => (
                      <tr key={t.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{idx + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>{new Date(t.date).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{adToBs(t.date)} BS</div>
                        </td>
                        <td className="px-4 py-3">{groupKey(t)}</td>
                        <td className="px-4 py-3">
                          {t.description}
                          {t.invoiceNo && <div className="text-xs text-gray-500">Inv# {t.invoiceNo}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{t.paymentMethod}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">{t.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{(t.taxAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold">{(t.amount + (t.taxAmount || 0)).toLocaleString()}</td>
                      </tr>
                    ))}
                    {visible.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                          {searchQuery ? `No ${activeTab} transactions match "${searchQuery}".` : `No ${activeTab} transactions for this period.`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
