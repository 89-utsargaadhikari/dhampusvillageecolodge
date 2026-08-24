"use client"

import { useState, useEffect } from "react"
import { DollarSign, CreditCard, QrCode, Banknote, Building, TrendingUp, Calendar, Download, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Payment {
  id: number
  date: string
  dateAD: Date
  type: "income" | "expense"
  category: string
  description: string
  amount: number
  paymentMethod: string
  referenceType?: string
  referenceId?: number
  createdBy?: string
  createdAt: Date
}

interface PaymentStats {
  total: number
  cash: number
  card: number
  qr: number
  bankTransfer: number
  credit: number
}

export default function PaymentDashboard() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    total: 0,
    cash: 0,
    card: 0,
    qr: 0,
    bankTransfer: 0,
    credit: 0,
  })
  const [loading, setLoading] = useState(false)
  const [filterMethod, setFilterMethod] = useState<string>("all")
  const [filterDate, setFilterDate] = useState<string>("")
  const [newPayment, setNewPayment] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "income" as "income" | "expense",
    category: "room_booking",
    description: "",
    amount: "",
    paymentMethod: "cash",
  })

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/accounts/transactions")
      const data = await response.json()
      setPayments(data)
      calculateStats(data)
    } catch (error) {
      console.error("Failed to fetch payments:", error)
    }
  }

  const calculateStats = (paymentsData: Payment[]) => {
    const newStats: PaymentStats = {
      total: 0,
      cash: 0,
      card: 0,
      qr: 0,
      bankTransfer: 0,
      credit: 0,
    }

    paymentsData.forEach((payment) => {
      if (payment.type === "income") {
        newStats.total += payment.amount
        
        const method = payment.paymentMethod?.toLowerCase() || "cash"
        if (method.includes("cash")) newStats.cash += payment.amount
        else if (method.includes("card")) newStats.card += payment.amount
        else if (method.includes("qr")) newStats.qr += payment.amount
        else if (method.includes("bank") || method.includes("transfer")) newStats.bankTransfer += payment.amount
        else if (method.includes("credit")) newStats.credit += payment.amount
      }
    })

    setStats(newStats)
  }

  const handleAddPayment = async () => {
    if (!newPayment.description || !newPayment.amount) {
      alert("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/accounts/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPayment,
          amount: parseFloat(newPayment.amount),
          currency: "NPR",
          exchangeRate: 1,
          amountNPR: parseFloat(newPayment.amount),
          createdBy: "Manual Entry",
        }),
      })

      if (response.ok) {
        await fetchPayments()
        setNewPayment({
          date: new Date().toISOString().split('T')[0],
          type: "income",
          category: "room_booking",
          description: "",
          amount: "",
          paymentMethod: "cash",
        })
        alert("✅ Payment recorded successfully!")
      } else {
        alert("❌ Failed to record payment")
      }
    } catch (error) {
      console.error("Failed to add payment:", error)
      alert("❌ Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  const getFilteredPayments = () => {
    let filtered = payments.filter(p => p.type === "income")

    if (filterMethod !== "all") {
      filtered = filtered.filter(p => p.paymentMethod?.toLowerCase().includes(filterMethod))
    }

    if (filterDate) {
      filtered = filtered.filter(p => p.date === filterDate || new Date(p.dateAD).toISOString().split('T')[0] === filterDate)
    }

    return filtered
  }

  const exportToCSV = () => {
    const filtered = getFilteredPayments()
    const csv = [
      ["Date", "Type", "Category", "Description", "Amount", "Payment Method", "Reference"].join(","),
      ...filtered.map(p => [
        p.date,
        p.type,
        p.category,
        p.description,
        p.amount,
        p.paymentMethod,
        p.referenceType ? `${p.referenceType}-${p.referenceId}` : ""
      ].join(","))
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const paymentMethods = [
    { id: "cash", name: "Cash", icon: Banknote, color: "from-green-500 to-green-600" },
    { id: "card", name: "Card", icon: CreditCard, color: "from-blue-500 to-blue-600" },
    { id: "qr", name: "QR/Digital", icon: QrCode, color: "from-purple-500 to-purple-600" },
    { id: "bank_transfer", name: "Bank Transfer", icon: Building, color: "from-yellow-500 to-yellow-600" },
    { id: "credit", name: "Credit", icon: TrendingUp, color: "from-red-500 to-red-600" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Payment Dashboard</h2>
        <p className="text-gray-600">Track all payments by method - Cash, Card, QR, Bank Transfer, Credit</p>
      </div>

      {/* Payment Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Income</p>
                <p className="text-2xl font-bold text-green-700">
                  NPR {stats.total.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Individual Payment Methods */}
        {paymentMethods.map((method) => {
          const Icon = method.icon
          const amount = stats[method.id as keyof PaymentStats]
          return (
            <Card key={method.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{method.name}</p>
                    <p className="text-lg font-bold">
                      {amount.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${method.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add New Payment */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <DollarSign className="w-5 h-5" />
            Record New Payment
          </CardTitle>
          <CardDescription>Manually add cash, card, QR, or other payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={newPayment.date}
                onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                className="border-green-300"
              />
            </div>

            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={newPayment.type} onValueChange={(value: any) => setNewPayment({ ...newPayment, type: value })}>
                <SelectTrigger className="border-green-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={newPayment.category} onValueChange={(value) => setNewPayment({ ...newPayment, category: value })}>
                <SelectTrigger className="border-green-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="room_booking">Room Booking</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description *</Label>
              <Input
                value={newPayment.description}
                onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                placeholder="Payment description..."
                className="border-green-300"
              />
            </div>

            <div className="space-y-2">
              <Label>Amount (NPR) *</Label>
              <Input
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                placeholder="0.00"
                className="border-green-300"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Payment Method *</Label>
              <div className="grid grid-cols-5 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setNewPayment({ ...newPayment, paymentMethod: method.id })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        newPayment.paymentMethod === method.id
                          ? `border-green-500 bg-gradient-to-br ${method.color} text-white shadow-lg scale-105`
                          : "border-gray-200 hover:border-green-300 bg-white"
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-1 ${newPayment.paymentMethod === method.id ? "text-white" : "text-gray-600"}`} />
                      <p className={`text-xs font-semibold ${newPayment.paymentMethod === method.id ? "text-white" : "text-gray-700"}`}>
                        {method.name}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <Button
            onClick={handleAddPayment}
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700"
            size="lg"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </CardContent>
      </Card>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Filter and view all recorded payments</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-0 sm:min-w-[200px]">
              <Label className="text-sm mb-2 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Payment Method
              </Label>
              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="qr">QR/Digital</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-0 sm:min-w-[200px]">
              <Label className="text-sm mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </Label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>

          {/* Payment List */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Method</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {getFilteredPayments().length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    getFilteredPayments().map((payment) => {
                      const method = paymentMethods.find(m => payment.paymentMethod?.toLowerCase().includes(m.id))
                      const Icon = method?.icon || Banknote
                      return (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{payment.date}</td>
                          <td className="px-4 py-3 text-sm">{payment.description}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                              {payment.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-gray-600" />
                              <span className="capitalize">{payment.paymentMethod}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                            NPR {payment.amount.toLocaleString()}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



