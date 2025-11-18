// Credit/Debt Management System

export interface CreditAccount {
  id: string
  guestName: string
  guestEmail: string
  guestPhone: string
  totalAmount: number // Total owed
  paidAmount: number // Amount paid so far
  balanceAmount: number // Remaining balance
  creditDate: string // When credit was given
  dueDate: string // Payment due date
  status: "pending" | "partial" | "paid" | "overdue"
  linkedBookingId?: number // Link to booking if applicable
  linkedBillId?: string // Link to bill if applicable
  transactions: CreditTransaction[]
  notes?: string
  lastReminderSent?: string
}

export interface CreditTransaction {
  id: string
  date: string
  type: "credit_given" | "payment_received" | "adjustment"
  amount: number
  paymentMethod?: "cash" | "card" | "qr" | "bank_transfer"
  description: string
  receivedBy?: string // Staff member who received payment
}

const STORAGE_KEY = "credit_accounts"

// Get all credit accounts
export const getCreditAccounts = (): CreditAccount[] => {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

// Save credit accounts
const saveCreditAccounts = (accounts: CreditAccount[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
  // Trigger event for real-time updates
  window.dispatchEvent(new Event("creditAccountsUpdated"))
}

// Add new credit account
export const addCreditAccount = (account: Omit<CreditAccount, "id" | "transactions" | "balanceAmount" | "status">): CreditAccount => {
  const accounts = getCreditAccounts()
  const balanceAmount = account.totalAmount - account.paidAmount
  const status = balanceAmount === 0 ? "paid" : account.paidAmount > 0 ? "partial" : "pending"
  
  const newAccount: CreditAccount = {
    ...account,
    id: Date.now().toString(),
    balanceAmount,
    status,
    transactions: [{
      id: Date.now().toString(),
      date: account.creditDate,
      type: "credit_given",
      amount: account.totalAmount,
      description: "Credit account created"
    }]
  }
  
  accounts.push(newAccount)
  saveCreditAccounts(accounts)
  return newAccount
}

// Add payment to credit account
export const addPayment = (
  accountId: string,
  amount: number,
  paymentMethod: CreditTransaction["paymentMethod"],
  description: string,
  receivedBy?: string
): void => {
  const accounts = getCreditAccounts()
  const account = accounts.find(a => a.id === accountId)
  
  if (!account) return
  
  // Add transaction
  const transaction: CreditTransaction = {
    id: Date.now().toString(),
    date: new Date().toISOString().split("T")[0],
    type: "payment_received",
    amount,
    paymentMethod,
    description,
    receivedBy
  }
  
  account.transactions.push(transaction)
  account.paidAmount += amount
  account.balanceAmount = account.totalAmount - account.paidAmount
  
  // Update status
  if (account.balanceAmount <= 0) {
    account.status = "paid"
  } else if (account.paidAmount > 0) {
    account.status = "partial"
  }
  
  saveCreditAccounts(accounts)
  
  // Add to AMS as income
  const accountTransactions = JSON.parse(localStorage.getItem("account_transactions") || "[]")
  accountTransactions.unshift({
    id: Date.now(),
    date: new Date().toISOString().split("T")[0],
    type: "income",
    category: "credit_collection",
    description: `Credit payment from ${account.guestName} - ${description}`,
    amount: amount,
    currency: "NPR",
    paymentMethod: paymentMethod || "cash"
  })
  localStorage.setItem("account_transactions", JSON.stringify(accountTransactions))
}

// Update credit account
export const updateCreditAccount = (accountId: string, updates: Partial<CreditAccount>): void => {
  const accounts = getCreditAccounts()
  const index = accounts.findIndex(a => a.id === accountId)
  
  if (index !== -1) {
    accounts[index] = { ...accounts[index], ...updates }
    
    // Recalculate balance and status
    accounts[index].balanceAmount = accounts[index].totalAmount - accounts[index].paidAmount
    if (accounts[index].balanceAmount <= 0) {
      accounts[index].status = "paid"
    } else if (accounts[index].paidAmount > 0) {
      accounts[index].status = "partial"
    }
    
    saveCreditAccounts(accounts)
  }
}

// Mark reminder sent
export const markReminderSent = (accountId: string): void => {
  const accounts = getCreditAccounts()
  const account = accounts.find(a => a.id === accountId)
  
  if (account) {
    account.lastReminderSent = new Date().toISOString().split("T")[0]
    saveCreditAccounts(accounts)
  }
}

// Get outstanding accounts
export const getOutstandingAccounts = (): CreditAccount[] => {
  return getCreditAccounts().filter(a => a.status !== "paid")
}

// Get overdue accounts
export const getOverdueAccounts = (): CreditAccount[] => {
  const today = new Date().toISOString().split("T")[0]
  const accounts = getCreditAccounts()
  
  return accounts.filter(a => {
    if (a.status === "paid") return false
    return a.dueDate < today
  }).map(a => ({ ...a, status: "overdue" as const }))
}

// Get total outstanding
export const getTotalOutstanding = (): number => {
  return getCreditAccounts()
    .filter(a => a.status !== "paid")
    .reduce((sum, a) => sum + a.balanceAmount, 0)
}

// Get total overdue
export const getTotalOverdue = (): number => {
  return getOverdueAccounts()
    .reduce((sum, a) => sum + a.balanceAmount, 0)
}

// Get credit history for guest
export const getCreditHistoryByGuest = (guestEmail: string): CreditAccount[] => {
  return getCreditAccounts().filter(a => 
    a.guestEmail.toLowerCase() === guestEmail.toLowerCase()
  )
}

// Delete credit account (only if paid)
export const deleteCreditAccount = (accountId: string): boolean => {
  const accounts = getCreditAccounts()
  const account = accounts.find(a => a.id === accountId)
  
  if (!account) return false
  if (account.status !== "paid") {
    alert("Cannot delete account with outstanding balance!")
    return false
  }
  
  const filtered = accounts.filter(a => a.id !== accountId)
  saveCreditAccounts(filtered)
  return true
}

// Collection report
export interface CollectionReport {
  totalAccounts: number
  paidAccounts: number
  pendingAccounts: number
  partialAccounts: number
  overdueAccounts: number
  totalCreditGiven: number
  totalCollected: number
  totalOutstanding: number
  totalOverdue: number
  collectionRate: number // Percentage collected
}

export const getCollectionReport = (): CollectionReport => {
  const accounts = getCreditAccounts()
  const overdue = getOverdueAccounts()
  
  const paidAccounts = accounts.filter(a => a.status === "paid")
  const pendingAccounts = accounts.filter(a => a.status === "pending")
  const partialAccounts = accounts.filter(a => a.status === "partial")
  
  const totalCreditGiven = accounts.reduce((sum, a) => sum + a.totalAmount, 0)
  const totalCollected = accounts.reduce((sum, a) => sum + a.paidAmount, 0)
  const totalOutstanding = accounts.reduce((sum, a) => sum + a.balanceAmount, 0)
  const totalOverdue = overdue.reduce((sum, a) => sum + a.balanceAmount, 0)
  
  const collectionRate = totalCreditGiven > 0 
    ? Math.round((totalCollected / totalCreditGiven) * 100) 
    : 0
  
  return {
    totalAccounts: accounts.length,
    paidAccounts: paidAccounts.length,
    pendingAccounts: pendingAccounts.length,
    partialAccounts: partialAccounts.length,
    overdueAccounts: overdue.length,
    totalCreditGiven,
    totalCollected,
    totalOutstanding,
    totalOverdue,
    collectionRate
  }
}


