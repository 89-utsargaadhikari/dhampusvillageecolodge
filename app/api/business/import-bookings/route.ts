import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { businessId, excelData } = body

    if (!businessId || !excelData || !Array.isArray(excelData)) {
      return NextResponse.json(
        { error: "Business ID and Excel data are required" },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      bookings: [] as any[],
      totalAmount: 0,
    }

    // Get business details
    const business = await prisma.business.findUnique({
      where: { id: parseInt(businessId) },
    })

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    // Process each row from Excel
    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i]
      
      try {
        // Parse the data from Excel columns
        const sn = row.SN || row.sn || (i + 1)
        const billNo = row["Bill NO"] || row["Bill_NO"] || row.billNo || `BILL-${Date.now()}-${i}`
        const date = row.Date || row.date || new Date().toISOString().split('T')[0]
        const guestName = row["Column 13"] || row.column13 || row.guestName || "Guest"
        const company = row.Company || row.company || business.name
        const roomType = row["Room Type"] || row.roomType || "Standard"
        const plan = row.PLAN || row.plan || "AP"
        const dblPrice = parseFloat(row.DBL || row.dbl || 0)
        const sglPrice = parseFloat(row.SGL || row.sgl || 0)
        const trplPrice = parseFloat(row.TRPL || row.trpl || 0)
        const currency = (row.Currency || row.currency || "NPR").toString().toUpperCase()
        const occupancy = trplPrice > 0 ? "TRPL" : dblPrice > 0 ? "DBL" : "SGL"
        const total = parseFloat(row.Total || row.total || (dblPrice + sglPrice + trplPrice))
        const amtBeforeVat = parseFloat(row["Amt Before VAT"] || row.amtBeforeVat || total / 1.13)
        const vatAmount = parseFloat(row["vat amount"] || row.vatAmount || (total - amtBeforeVat))

        // Calculate check-in and check-out dates
        const checkin = date
        const checkoutDate = new Date(date)
        checkoutDate.setDate(checkoutDate.getDate() + 1)
        const checkout = checkoutDate.toISOString().split('T')[0]

        // Determine number of guests based on room prices
        let numberOfGuests = 1
        if (trplPrice > 0) numberOfGuests = 3
        else if (dblPrice > 0) numberOfGuests = 2
        else if (sglPrice > 0) numberOfGuests = 1

        const planCode = String(plan).toUpperCase()
        const bookingType = planCode.includes("AI") ? "AI"
          : planCode.includes("MAP") ? "MAP"
          : planCode.includes("AP") ? "AP"
          : planCode.includes("BB") || planCode.includes("BREAKFAST") ? "BB"
          : planCode.includes("CP") ? "CP"
          : "EP"

        const booking = await prisma.booking.create({
          data: {
            guest: guestName,
            email: business.email || null,
            phone: business.phone || null,
            room: roomType,
            roomNumber: null,
            checkin,
            checkout,
            price: total.toString(),
            status: "Confirmed",
            bookingSource: "business",
            businessId: business.id,
            numberOfGuests,
            bookingType,
            occupancy,
            currency,
          },
        })

        // Create account transaction for the booking
        await prisma.accountTransaction.create({
          data: {
            date: date,
            dateAD: new Date(date),
            type: "income",
            category: "room_booking",
            description: `Business Booking - ${business.name} - ${guestName} - Bill #${billNo}`,
            amount: total,
            currency,
            exchangeRate: 1,
            amountNPR: total,
            paymentMethod: "credit",
            referenceType: "booking",
            referenceId: booking.id,
            taxAmount: vatAmount,
            taxPercentage: 13,
            notes: `Imported from Excel - Bill #${billNo} - Plan: ${plan}`,
            createdBy: "System Import",
          },
        })

        // Update business credit
        await prisma.business.update({
          where: { id: business.id },
          data: {
            currentCredit: {
              increment: total,
            },
          },
        })

        results.success++
        results.totalAmount += total
        results.bookings.push({
          sn,
          billNo,
          guest: guestName,
          roomType,
          total,
          bookingId: booking.id,
        })
      } catch (error) {
        results.failed++
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
        console.error(`Error processing row ${i + 1}:`, error)
      }
    }

    // Create a credit account entry for the total amount
    if (results.totalAmount > 0) {
      const creditDueDate = new Date()
      creditDueDate.setDate(creditDueDate.getDate() + 30) // 30 days credit period

      await prisma.creditAccount.create({
        data: {
          guestName: business.name,
          guestEmail: business.email || null,
          guestPhone: business.phone || "N/A",
          guestAddress: business.address || null,
          creditAmount: results.totalAmount,
          paidAmount: 0,
          outstandingBalance: results.totalAmount,
          creditDate: new Date(),
          dueDate: creditDueDate,
          status: "unpaid",
          businessId: business.id,
          notes: `Bulk import - ${results.success} bookings`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${results.success} bookings successfully. ${results.failed} failed.`,
      results,
    })
  } catch (error) {
    console.error("Error importing business bookings:", error)
    return NextResponse.json(
      { error: "Failed to import business bookings", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}



