"use client"

import { useState, useEffect } from "react"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as XLSX from "xlsx"

interface Business {
  id: number
  name: string
}

export default function BusinessBookingImport() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    fetchBusinesses()
  }, [])

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/business")
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error("Failed to fetch businesses:", errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to fetch businesses')
      }
      const data = await response.json()
      setBusinesses(data)
    } catch (error: any) {
      console.error("Failed to fetch businesses:", error)
      alert(`Failed to load businesses: ${error.message}`)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
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
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = (error) => reject(error)
      reader.readAsBinaryString(file)
    })
  }

  const handleImport = async () => {
    if (!file || !selectedBusiness) {
      alert("Please select a business and upload an Excel file")
      return
    }

    setLoading(true)
    try {
      // Parse Excel file
      const excelData = await parseExcelFile(file)

      // Send to API
      const response = await fetch("/api/business/import-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBusiness,
          excelData,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data.results)
        alert(`✅ Success! Imported ${data.results.success} bookings.\nTotal Amount: NPR ${data.results.totalAmount.toLocaleString()}`)
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById("file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Import error:", error)
      alert("❌ Failed to import bookings")
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    // Create template Excel file
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
      },
      {
        "SN": 2,
        "Bill NO": "126",
        "Date": "2025-05-16",
        "Column 13": "Jane Smith",
        "Company": "ABC Travel",
        "Room Type": "Standard",
        "PLAN": "BB",
        "DBL": 24000,
        "SGL": 0,
        "TRPL": 0,
        "Total": 24000,
        "Amt Before VAT": 21238.94,
        "vat amount": 2761.06
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Bookings")
    XLSX.writeFile(wb, "Business_Booking_Template.xlsx")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Import Business Bookings from Excel</h2>
        <p className="text-gray-600">
          Upload Excel file with billing data to automatically create bookings and transactions
        </p>
      </div>

      {/* Template Download */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <FileSpreadsheet className="w-5 h-5" />
            Download Template
          </CardTitle>
          <CardDescription>Get the Excel template with correct column format</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Excel Template
          </Button>
          <div className="mt-4 text-sm text-gray-600">
            <p className="font-semibold mb-2">Required Columns:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <span className="bg-white px-2 py-1 rounded">• SN</span>
              <span className="bg-white px-2 py-1 rounded">• Bill NO</span>
              <span className="bg-white px-2 py-1 rounded">• Date</span>
              <span className="bg-white px-2 py-1 rounded">• Column 13 (Guest Name)</span>
              <span className="bg-white px-2 py-1 rounded">• Company</span>
              <span className="bg-white px-2 py-1 rounded">• Room Type</span>
              <span className="bg-white px-2 py-1 rounded">• PLAN (AP/BB)</span>
              <span className="bg-white px-2 py-1 rounded">• DBL (Double)</span>
              <span className="bg-white px-2 py-1 rounded">• SGL (Single)</span>
              <span className="bg-white px-2 py-1 rounded">• TRPL (Triple)</span>
              <span className="bg-white px-2 py-1 rounded">• Total</span>
              <span className="bg-white px-2 py-1 rounded">• Amt Before VAT</span>
              <span className="bg-white px-2 py-1 rounded">• vat amount</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Form */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Upload className="w-5 h-5" />
            Import Bookings
          </CardTitle>
          <CardDescription>Select business and upload Excel file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Select Business *</label>
            <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
              <SelectTrigger className="border-green-300">
                <SelectValue placeholder="Choose a business..." />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((business) => (
                  <SelectItem key={business.id} value={business.id.toString()}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Upload Excel File *</label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {file && (
              <p className="text-sm text-green-600">
                ✓ Selected: {file.name}
              </p>
            )}
          </div>

          <Button
            onClick={handleImport}
            disabled={loading || !file || !selectedBusiness}
            className="w-full bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700"
            size="lg"
          >
            <Upload className="w-5 h-5 mr-2" />
            {loading ? "Importing..." : "Import Bookings"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className={result.success > 0 ? "border-green-300" : "border-red-300"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-3xl font-bold text-green-600">{result.success}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-3xl font-bold text-red-600">{result.failed}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">NPR {result.totalAmount.toLocaleString()}</p>
              </div>
            </div>

            {result.bookings.length > 0 && (
              <div>
                <p className="font-semibold mb-2">Imported Bookings:</p>
                <div className="max-h-64 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">SN</th>
                        <th className="p-2 text-left">Bill NO</th>
                        <th className="p-2 text-left">Guest</th>
                        <th className="p-2 text-left">Room Type</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.bookings.map((booking: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{booking.sn}</td>
                          <td className="p-2">{booking.billNo}</td>
                          <td className="p-2">{booking.guest}</td>
                          <td className="p-2">{booking.roomType}</td>
                          <td className="p-2 text-right">NPR {booking.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div>
                <p className="font-semibold text-red-600 mb-2">Errors:</p>
                <div className="max-h-32 overflow-y-auto bg-red-50 border border-red-200 rounded p-3">
                  {result.errors.map((error: string, idx: number) => (
                    <p key={idx} className="text-sm text-red-700">• {error}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="border-yellow-300 bg-yellow-50">
        <CardContent className="pt-6">
          <p className="text-sm text-yellow-800">
            <strong>📊 What happens automatically:</strong>
          </p>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
            <li>Creates bookings for each row in Excel</li>
            <li>Generates account transactions (income) with VAT details</li>
            <li>Updates business credit balance</li>
            <li>Creates credit account entry for payment tracking</li>
            <li>Links everything to the selected business</li>
            <li>Sets booking type based on PLAN (AP = Bed Only, BB = Bed & Breakfast)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}



