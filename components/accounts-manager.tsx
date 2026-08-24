"use client"

import { useState, useEffect } from "react"
import { Plus, TrendingUp, TrendingDown, Download, Calendar, CreditCard, AlertCircle, DollarSign, Send, History, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Credit management now fully database-driven
import { addNotification } from "@/lib/notifications"
import { 
  fetchAccountTransactions,
  createAccountTransaction,
  deleteAccountTransaction,
  fetchCreditAccounts,
  createCreditAccount,
  updateCreditAccount as updateCreditAPI,
  addCreditPayment
} from "@/lib/api"

interface CreditAccount {
  id: number
  guestName: string
  guestPhone: string
  guestEmail: string | null
  creditAmount: number
  paidAmount: number
  outstandingBalance: number
  creditDate: string
  dueDate: string
  status: string
  linkedBookingId: number | null
  notes: string | null
  lastReminderSent: string | null
  payments: any[]
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
}

export default function AccountsManager() {
  const [activeTab, setActiveTab] = useState<"transactions" | "credit">("transactions")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [creditAccounts, setCreditAccounts] = useState<CreditAccount[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadData()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadData, 10000)
    
    // Listen for credit account updates & import events
    const handleUpdate = () => loadData()
    window.addEventListener("creditAccountsUpdated", handleUpdate)
    window.addEventListener("transactionsImported", handleUpdate)
    window.addEventListener("storage", handleUpdate)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener("creditAccountsUpdated", handleUpdate)
      window.removeEventListener("transactionsImported", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
    }
  }, [])
  
  const loadData = async () => {
    try {
      const [transactionsData, creditsData] = await Promise.all([
        fetchAccountTransactions(),
        fetchCreditAccounts()
      ])
      setTransactions(transactionsData)
      setCreditAccounts(creditsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleAddTransaction = async (txn: Omit<Transaction, "id">) => {
    try {
      await createAccountTransaction({
        date: txn.date,
        type: txn.type,
        category: txn.category,
        description: txn.description,
        amount: txn.amount,
        currency: txn.currency || 'NPR',
        paymentMethod: txn.paymentMethod,
        notes: txn.notes
      })
      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Failed to add transaction:', error)
      alert('Failed to add transaction')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Delete this transaction?")) {
      try {
        await deleteAccountTransaction(id)
        loadData()
      } catch (error) {
        console.error('Failed to delete transaction:', error)
        alert('Failed to delete transaction')
      }
    }
  }

  // Filter by month/year
  const filteredTransactions = transactions.filter(t => {
    const txnDate = new Date(t.date)
    return txnDate.getMonth() === selectedMonth && txnDate.getFullYear() === selectedYear
  })

  const totalIncome = filteredTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const profit = totalIncome - totalExpense

  const handleExportExcel = () => {
    const csvContent = [
      ["Date", "Type", "Category", "Description", "Amount", "Currency", "Payment Method"],
      ...filteredTransactions.map(t => [
        t.date, t.type, t.category, t.description, t.amount, t.currency, t.paymentMethod
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `accounts_${selectedYear}_${selectedMonth + 1}.csv`
    link.click()
  }

  const handleAddCredit = async (credit: any) => {
    try {
      await createCreditAccount(credit)
      await loadData()
      setIsCreditDialogOpen(false)
    
      // Add notification for overdue tracking
      const daysUntilDue = Math.ceil((new Date(credit.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilDue <= 7) {
        addNotification(
          "payment",
          "Credit Account Created",
          `${credit.guestName} - NPR ${credit.creditAmount} due in ${daysUntilDue} days`,
          "high",
          "accounts"
        )
      }
    } catch (error) {
      console.error('Failed to add credit account:', error)
      alert('Failed to add credit account')
    }
  }
  
  
  const handleSendReminder = async (account: CreditAccount) => {
    try {
      await updateCreditAPI(account.id, {
        lastReminderSent: new Date().toISOString().split("T")[0]
      })
      await loadData()
      
      alert(`📧 Reminder sent to ${account.guestName}\n\nPhone: ${account.guestPhone}\nEmail: ${account.guestEmail}\nBalance: NPR ${account.outstandingBalance}\n\n(In production, this will send actual SMS/Email)`)
    } catch (error) {
      console.error('Failed to send reminder:', error)
      alert('Failed to send reminder')
    }
  }
  
  // Calculate credit stats from loaded data
  const outstandingAccounts = creditAccounts.filter(c => c.status !== 'paid')
  const overdueAccounts = creditAccounts.filter(c => {
    const isOverdue = new Date(c.dueDate) < new Date()
    return c.status !== 'paid' && isOverdue
  })
  const totalOutstanding = creditAccounts.reduce((sum, c) => sum + c.outstandingBalance, 0)
  const totalOverdue = overdueAccounts.reduce((sum, c) => sum + c.outstandingBalance, 0)
  const totalCredit = creditAccounts.reduce((sum, c) => sum + c.creditAmount, 0)
  const totalCollected = creditAccounts.reduce((sum, c) => sum + c.paidAmount, 0)
  const collectionRate = totalCredit > 0 ? (totalCollected / totalCredit) * 100 : 0
  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Account Management System (AMS)</h2>
        <div className="flex flex-wrap gap-2">
          {activeTab === "transactions" && (
            <>
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </>
          )}
          {activeTab === "credit" && (
            <Button onClick={() => setIsCreditDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Credit Account
            </Button>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="transactions">
            <FileText className="w-4 h-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="credit">
            <CreditCard className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Credit/Debt Tracking</span>
            <span className="sm:hidden">Credit</span>
          </TabsTrigger>
        </TabsList>
        
        {/* TRANSACTIONS TAB */}
        <TabsContent value="transactions" className="space-y-6 mt-6">

      {/* Month/Year Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <TrendingUp className="w-5 h-5" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">NPR {totalIncome.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <TrendingDown className="w-5 h-5" />
              Total Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700">NPR {totalExpense.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className={profit >= 0 ? "bg-blue-50" : "bg-orange-50"}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${profit >= 0 ? "text-blue-700" : "text-orange-700"}`}>
              💰 Profit/Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${profit >= 0 ? "text-blue-700" : "text-orange-700"}`}>
              NPR {profit.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold">Description</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold">Amount</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold">Payment</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(txn => (
                  <tr key={txn.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4">{new Date(txn.date).toLocaleDateString()}</td>
                    <td className="px-3 sm:px-6 py-4">
                      <Badge variant={txn.type === "income" ? "default" : "destructive"}>
                        {txn.type}
                      </Badge>
                    </td>
                    <td className="px-3 sm:px-6 py-4">{txn.category}</td>
                    <td className="px-3 sm:px-6 py-4">{txn.description}</td>
                    <td className="px-3 sm:px-6 py-4 font-bold whitespace-nowrap">{txn.currency} {txn.amount.toLocaleString()}</td>
                    <td className="px-3 sm:px-6 py-4">
                      <Badge variant="outline">{txn.paymentMethod}</Badge>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(txn.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

        </TabsContent>
        
        {/* CREDIT/DEBT TRACKING TAB */}
        <TabsContent value="credit" className="space-y-6 mt-6">
          {/* Credit Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700">Total Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-900">NPR {totalOutstanding.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-1">{creditAccounts.filter(a => a.outstandingBalance > 0).length} accounts</p>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-900">NPR {totalOverdue.toLocaleString()}</p>
                <p className="text-xs text-red-600 mt-1">{overdueAccounts.length} accounts</p>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700">Collection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-900">{collectionRate.toFixed(1)}%</p>
                <p className="text-xs text-green-600 mt-1">{creditAccounts.filter(a => a.status === 'paid').length} of {creditAccounts.length} paid</p>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-700">Total Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-900">NPR {totalCollected.toLocaleString()}</p>
                <p className="text-xs text-purple-600 mt-1">of NPR {totalCredit.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Outstanding Accounts Alert */}
          {overdueAccounts.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-2">⚠️ Overdue Payments Alert</h4>
                    <p className="text-sm text-red-700 mb-3">
                      You have {overdueAccounts.length} overdue account(s) totaling NPR {totalOverdue.toLocaleString()}. 
                      Consider sending payment reminders.
                    </p>
                    <div className="flex gap-2">
                      {overdueAccounts.slice(0, 3).map(account => (
                        <Button 
                          key={account.id}
                          size="sm" 
                          variant="outline"
                          className="text-xs border-red-300 hover:bg-red-100"
                          onClick={() => handleSendReminder(account)}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Remind {account.guestName.split(" ")[0]}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Credit Accounts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Accounts ({creditAccounts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {creditAccounts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No credit accounts yet</p>
                  <Button className="mt-4" onClick={() => setIsCreditDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Credit Account
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Guest</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Contact</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Total Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Paid</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Balance</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Due Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditAccounts.map(account => {
                        const isOverdue = account.dueDate < new Date().toISOString().split("T")[0] && account.status !== "paid"
                        const daysOverdue = isOverdue ? Math.floor((new Date().getTime() - new Date(account.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
                        
                        return (
                          <tr key={account.id} className={`border-b hover:bg-gray-50 ${isOverdue ? "bg-red-50" : ""}`}>
                            <td className="px-4 py-3">
                              <div className="font-medium">{account.guestName}</div>
                              {account.linkedBookingId && (
                                <div className="text-xs text-gray-500">Booking #{account.linkedBookingId}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div>{account.guestPhone}</div>
                              <div className="text-xs text-gray-500">{account.guestEmail}</div>
                            </td>
                            <td className="px-4 py-3 font-semibold">NPR {account.creditAmount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-green-600">NPR {account.paidAmount.toLocaleString()}</td>
                            <td className="px-4 py-3 font-bold text-red-600">NPR {account.outstandingBalance.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <div className="text-sm">{new Date(account.dueDate).toLocaleDateString()}</div>
                              {isOverdue && (
                                <div className="text-xs text-red-600 font-medium">{daysOverdue} days overdue</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={
                                account.status === "paid" ? "default" :
                                isOverdue ? "destructive" :
                                account.status === "partial" ? "secondary" : "outline"
                              }>
                                {isOverdue ? "OVERDUE" : account.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {account.status !== "paid" && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="default"
                                      onClick={() => {
                                        setSelectedAccount(account)
                                        setIsPaymentDialogOpen(true)
                                      }}
                                    >
                                      <DollarSign className="w-3 h-3 mr-1" />
                                      Pay
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleSendReminder(account)}
                                    >
                                      <Send className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedAccount(account)
                                    setIsHistoryDialogOpen(true)
                                  }}
                                >
                                  <History className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Collection Report */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Credit Given</p>
                  <p className="text-lg font-bold">NPR {totalCredit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Collected</p>
                  <p className="text-lg font-bold text-green-600">NPR {totalCollected.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Outstanding</p>
                  <p className="text-lg font-bold text-red-600">NPR {totalOutstanding.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Success Rate</p>
                  <p className="text-lg font-bold text-blue-600">{collectionRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Transaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            handleAddTransaction({
              date: formData.get("date") as string,
              type: formData.get("type") as "income" | "expense",
              category: formData.get("category") as string,
              description: formData.get("description") as string,
              amount: parseFloat(formData.get("amount") as string),
              currency: formData.get("currency") as string,
              paymentMethod: formData.get("paymentMethod") as string
            })
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room_booking">Room Booking</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input id="description" name="description" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select name="currency" defaultValue="NPR" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NPR">NPR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select name="paymentMethod" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="qr">QR/UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Add Transaction</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add Credit Account Dialog */}
      <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Credit Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            handleAddCredit({
              guestName: formData.get("guestName") as string,
              guestEmail: formData.get("guestEmail") as string,
              guestPhone: formData.get("guestPhone") as string,
              creditAmount: parseFloat(formData.get("creditAmount") as string),
              paidAmount: parseFloat(formData.get("paidAmount") as string) || 0,
              creditDate: formData.get("creditDate") as string,
              dueDate: formData.get("dueDate") as string,
              linkedBookingId: parseInt(formData.get("linkedBookingId") as string) || undefined,
              notes: formData.get("notes") as string || undefined
            })
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">Guest Name *</Label>
                <Input id="guestName" name="guestName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestPhone">Phone *</Label>
                <Input id="guestPhone" name="guestPhone" type="tel" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestEmail">Email *</Label>
              <Input id="guestEmail" name="guestEmail" type="email" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditAmount">Total Amount (NPR) *</Label>
                <Input id="creditAmount" name="creditAmount" type="number" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidAmount">Paid Amount (NPR)</Label>
                <Input id="paidAmount" name="paidAmount" type="number" step="0.01" defaultValue="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditDate">Credit Given On *</Label>
                <Input id="creditDate" name="creditDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Payment Due Date *</Label>
                <Input id="dueDate" name="dueDate" type="date" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedBookingId">Linked Booking ID (Optional)</Label>
              <Input id="linkedBookingId" name="linkedBookingId" type="number" placeholder="Enter booking ID if applicable" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input id="notes" name="notes" placeholder="Additional notes or payment terms" />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreditDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Create Credit Account</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Guest:</span>
                  <span className="font-semibold">{selectedAccount.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="font-semibold">NPR {selectedAccount.creditAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Already Paid:</span>
                  <span className="text-green-600 font-semibold">NPR {selectedAccount.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm text-gray-600">Balance Due:</span>
                  <span className="text-red-600 font-bold text-lg">NPR {selectedAccount.outstandingBalance.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const amount = parseFloat(formData.get("amount") as string)
                
                if (amount > selectedAccount.outstandingBalance) {
                  alert(`Payment amount cannot exceed balance of NPR ${selectedAccount.outstandingBalance}`)
                  return
                }
                
                handlePayment(
                  selectedAccount.id,
                  amount,
                  formData.get("paymentMethod"),
                  formData.get("description") as string
                )
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount (NPR) *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    max={selectedAccount.outstandingBalance}
                    required 
                    placeholder={`Max: ${selectedAccount.outstandingBalance}`}
                  />
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById("amount") as HTMLInputElement
                        if (input) input.value = selectedAccount.outstandingBalance.toString()
                      }}
                    >
                      Full Amount
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById("amount") as HTMLInputElement
                        if (input) input.value = (selectedAccount.outstandingBalance / 2).toString()
                      }}
                    >
                      Half
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select name="paymentMethod" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="qr">QR/UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    name="description" 
                    placeholder="e.g., Partial payment, Final settlement" 
                    defaultValue="Payment received"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsPaymentDialogOpen(false)
                      setSelectedAccount(null)
                    }} 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">Record Payment</Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              {/* Account Summary */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Guest Name</p>
                      <p className="font-semibold">{selectedAccount.guestName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Contact</p>
                      <p className="font-semibold">{selectedAccount.guestPhone}</p>
                      <p className="text-xs text-gray-500">{selectedAccount.guestEmail}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Credit Date</p>
                      <p className="font-semibold">{new Date(selectedAccount.creditDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Due Date</p>
                      <p className="font-semibold">{new Date(selectedAccount.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Amount</p>
                      <p className="text-lg font-bold">NPR {selectedAccount.creditAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Balance</p>
                      <p className="text-lg font-bold text-red-600">NPR {selectedAccount.outstandingBalance.toLocaleString()}</p>
                    </div>
                  </div>
                  {selectedAccount.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">Notes:</p>
                      <p className="text-sm">{selectedAccount.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transaction List */}
              <div className="space-y-2">
                <h4 className="font-semibold">Transaction History</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedAccount.transactions.map(txn => (
                    <div key={txn.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`mt-1 w-2 h-2 rounded-full ${
                        txn.type === "credit_given" ? "bg-blue-500" :
                        txn.type === "payment_received" ? "bg-green-500" : "bg-gray-500"
                      }`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{txn.description}</p>
                            <p className="text-xs text-gray-500">{new Date(txn.date).toLocaleDateString()}</p>
                            {txn.receivedBy && (
                              <p className="text-xs text-gray-500">Received by: {txn.receivedBy}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              txn.type === "payment_received" ? "text-green-600" : ""
                            }`}>
                              {txn.type === "payment_received" ? "+" : ""}NPR {txn.amount.toLocaleString()}
                            </p>
                            {txn.paymentMethod && (
                              <Badge variant="outline" className="text-xs">{txn.paymentMethod}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={() => {
                  setIsHistoryDialogOpen(false)
                  setSelectedAccount(null)
                }} 
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

