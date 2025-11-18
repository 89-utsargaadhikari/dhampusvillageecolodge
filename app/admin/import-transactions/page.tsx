"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createAccountTransaction } from "@/lib/api"

export default function ImportTransactionsPage() {
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)

  const downloadTemplate = () => {
    const csvContent = `Date,Type,Category,Description,Amount,Currency,Payment Method,Notes
2024-01-15,income,room_booking,Room 101 - John Doe (3 nights),15000,NPR,cash,
2024-01-15,income,restaurant,Restaurant order - Room 101,2500,NPR,card,
2024-01-16,expense,salary,Staff salary - January,45000,NPR,bank_transfer,
2024-01-16,expense,utilities,Electricity bill - January,8500,NPR,cash,
2024-01-17,income,other,Tourism guide service,5000,NPR,cash,
2024-01-18,expense,supplies,Kitchen supplies,12000,NPR,cash,Fresh vegetables and meat`

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "transactions_template.csv"
    link.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResults(null)
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    return lines.slice(1).map((line, index) => {
      // Handle quoted fields with commas
      const values: string[] = []
      let currentValue = ''
      let insideQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          insideQuotes = !insideQuotes
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim())
          currentValue = ''
        } else {
          currentValue += char
        }
      }
      values.push(currentValue.trim())
      
      const row: any = { lineNumber: index + 2 }
      headers.forEach((header, i) => {
        row[header.toLowerCase().replace(/\s+/g, '_')] = values[i] || ''
      })
      return row
    })
  }

  const validateTransaction = (txn: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    // Required fields
    if (!txn.date) errors.push("Date is required")
    if (!txn.type) errors.push("Type is required")
    if (!txn.category) errors.push("Category is required")
    if (!txn.description) errors.push("Description is required")
    if (!txn.amount) errors.push("Amount is required")
    
    // Validate type
    if (txn.type && !['income', 'expense'].includes(txn.type.toLowerCase())) {
      errors.push(`Type must be 'income' or 'expense', got '${txn.type}'`)
    }
    
    // Validate category
    const validCategories = ['room_booking', 'restaurant', 'bar', 'salary', 'utilities', 'supplies', 'maintenance', 'marketing', 'other']
    if (txn.category && !validCategories.includes(txn.category.toLowerCase())) {
      errors.push(`Invalid category '${txn.category}'. Must be one of: ${validCategories.join(', ')}`)
    }
    
    // Validate amount
    const amount = parseFloat(txn.amount)
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Amount must be a positive number, got '${txn.amount}'`)
    }
    
    // Validate date format (YYYY-MM-DD)
    if (txn.date && !/^\d{4}-\d{2}-\d{2}$/.test(txn.date)) {
      errors.push(`Date must be in format YYYY-MM-DD, got '${txn.date}'`)
    }
    
    return { valid: errors.length === 0, errors }
  }

  const handleImport = async () => {
    if (!file) {
      alert("Please select a CSV file first")
      return
    }

    setImporting(true)
    setResults(null)

    try {
      const text = await file.text()
      const rows = parseCSV(text)
      
      const results = {
        total: rows.length,
        success: 0,
        failed: 0,
        errors: [] as any[]
      }

      for (const row of rows) {
        const validation = validateTransaction(row)
        
        if (!validation.valid) {
          results.failed++
          results.errors.push({
            line: row.lineNumber,
            description: row.description || 'Unknown',
            errors: validation.errors
          })
          continue
        }

        try {
          await createAccountTransaction({
            date: row.date,
            type: row.type.toLowerCase(),
            category: row.category.toLowerCase(),
            description: row.description,
            amount: parseFloat(row.amount),
            currency: row.currency || 'NPR',
            paymentMethod: row.payment_method || null,
            notes: row.notes || null
          })
          results.success++
        } catch (error: any) {
          results.failed++
          results.errors.push({
            line: row.lineNumber,
            description: row.description || 'Unknown',
            errors: [error.message || 'Failed to create transaction']
          })
        }
      }

      setResults(results)
      
      // Notify AMS to refresh
      if (typeof window !== 'undefined' && results.success > 0) {
        window.dispatchEvent(new Event('transactionsImported'))
        localStorage.setItem('lastImport', Date.now().toString())
        console.log(`✅ Imported ${results.success} transactions - AMS will auto-refresh`)
      }
      
      if (results.success > 0) {
        alert(`✅ Import Complete!\n\nSuccess: ${results.success}\nFailed: ${results.failed}\n\nCheck the results below for details.`)
      } else {
        alert(`❌ Import Failed!\n\nAll ${results.failed} transactions failed to import.\nCheck the errors below.`)
      }
    } catch (error: any) {
      alert(`❌ Failed to parse CSV file: ${error.message}`)
      setResults({ total: 0, success: 0, failed: 0, errors: [{ line: 0, description: 'File parse error', errors: [error.message] }] })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="outline">← Back to Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Import Transactions from Excel/CSV
          </CardTitle>
          <CardDescription>
            Upload your existing transactions from Excel or CSV files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Before importing:</strong>
              <ol className="mt-2 ml-4 space-y-1 text-sm">
                <li>1. Download the CSV template below</li>
                <li>2. Fill in your transaction data following the format</li>
                <li>3. Save as CSV file (in Excel: File → Save As → CSV UTF-8)</li>
                <li>4. Upload the CSV file here</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Download Template */}
          <div className="p-4 border rounded-lg bg-blue-50">
            <h3 className="font-semibold mb-2">Step 1: Download Template</h3>
            <Button onClick={downloadTemplate} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
          </div>

          {/* Format Requirements */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-3">Required CSV Format:</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Date:</strong> <code className="bg-gray-100 px-2 py-1 rounded">YYYY-MM-DD</code> format (e.g., 2024-01-15)
              </div>
              <div>
                <strong>Type:</strong> <code className="bg-gray-100 px-2 py-1 rounded">income</code> or <code className="bg-gray-100 px-2 py-1 rounded">expense</code>
              </div>
              <div>
                <strong>Category:</strong> Choose from:
                <div className="mt-1 ml-4">
                  <span className="inline-block bg-green-100 px-2 py-1 rounded text-xs mr-2 mb-1">room_booking</span>
                  <span className="inline-block bg-green-100 px-2 py-1 rounded text-xs mr-2 mb-1">restaurant</span>
                  <span className="inline-block bg-green-100 px-2 py-1 rounded text-xs mr-2 mb-1">bar</span>
                  <span className="inline-block bg-red-100 px-2 py-1 rounded text-xs mr-2 mb-1">salary</span>
                  <span className="inline-block bg-red-100 px-2 py-1 rounded text-xs mr-2 mb-1">utilities</span>
                  <span className="inline-block bg-red-100 px-2 py-1 rounded text-xs mr-2 mb-1">supplies</span>
                  <span className="inline-block bg-red-100 px-2 py-1 rounded text-xs mr-2 mb-1">maintenance</span>
                  <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-2 mb-1">other</span>
                </div>
              </div>
              <div>
                <strong>Description:</strong> Free text (e.g., "Room 101 - John Doe")
              </div>
              <div>
                <strong>Amount:</strong> Number only, no currency symbol (e.g., 15000)
              </div>
              <div>
                <strong>Currency:</strong> NPR, USD, EUR, etc. (optional, defaults to NPR)
              </div>
              <div>
                <strong>Payment Method:</strong> cash, card, bank_transfer, qr, credit (optional)
              </div>
              <div>
                <strong>Notes:</strong> Additional details (optional)
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="p-4 border rounded-lg bg-green-50">
            <h3 className="font-semibold mb-2">Step 2: Upload CSV File</h3>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full p-2 border rounded"
            />
            {file && (
              <p className="mt-2 text-sm text-green-700">
                ✓ Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
            size="lg"
          >
            {importing ? "Importing..." : "Import Transactions"}
          </Button>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <Alert className={results.success > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                {results.success > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-semibold">
                      Import Results
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>Total: <strong>{results.total}</strong></div>
                      <div className="text-green-700">Success: <strong>{results.success}</strong></div>
                      <div className="text-red-700">Failed: <strong>{results.failed}</strong></div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {results.errors.length > 0 && (
                <div className="p-4 border rounded-lg bg-red-50 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-red-900 mb-3">Errors ({results.errors.length}):</h3>
                  <div className="space-y-3">
                    {results.errors.map((error: any, i: number) => (
                      <div key={i} className="p-3 bg-white rounded border border-red-200">
                        <p className="font-semibold text-sm">
                          Line {error.line}: {error.description}
                        </p>
                        <ul className="mt-1 ml-4 text-xs text-red-700">
                          {error.errors.map((err: string, j: number) => (
                            <li key={j}>• {err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.success > 0 && (
                <Link href="/admin">
                  <Button className="w-full">
                    View Imported Transactions in AMS
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

