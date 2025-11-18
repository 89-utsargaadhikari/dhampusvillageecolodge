"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, CheckCircle, Clock, XCircle, Mail, Phone, Calendar, MapPin } from "lucide-react"
import { fetchBookings } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Booking {
  id: number
  guest: string
  email: string | null
  phone: string | null
  room: string
  roomNumber: string | null
  checkin: string
  checkout: string
  price: string
  status: string
  bookingSource: string | null
}

export default function BookingStatusPage() {
  const [email, setEmail] = useState("")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if email is in URL params
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get("email")
    if (emailParam) {
      setEmail(emailParam)
      handleSearch(emailParam)
    }
  }, [])

  const handleSearch = async (searchEmail?: string) => {
    const emailToSearch = searchEmail || email
    if (!emailToSearch) return

    setLoading(true)
    try {
      console.log('🔍 Searching bookings for:', emailToSearch)
      const allBookings = await fetchBookings()
      console.log('📋 All bookings from database:', allBookings)
      const userBookings = allBookings.filter(
        (b) => b.email?.toLowerCase() === emailToSearch.toLowerCase()
      )
      console.log('✅ Found bookings:', userBookings)
      setBookings(userBookings)
      setSearched(true)
    } catch (error) {
      console.error('❌ Failed to fetch bookings:', error)
      alert('Failed to search bookings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Confirmed":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "Checked In":
        return <CheckCircle className="w-5 h-5 text-purple-600" />
      case "Checked Out":
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case "Pending":
        return <Clock className="w-5 h-5 text-yellow-600" />
      case "Cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-700 border-green-200"
      case "Checked In":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "Checked Out":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "Cancelled":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <span className="text-white font-display text-lg font-bold">D</span>
            </div>
            <div>
              <p className="font-display font-semibold text-primary">Dhampus Eco Lodge</p>
            </div>
          </Link>
          <Link href="/booking">
            <Button size="sm">Make a Booking</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary mb-4">Check Booking Status</h1>
          <p className="text-lg text-gray-600">Enter your email to view your booking details</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Your Booking</CardTitle>
            <CardDescription>Enter the email address you used when making the reservation</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSearch()
              }}
              className="flex gap-4"
            >
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="flex items-center gap-2" disabled={loading}>
                <Search size={18} />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <div className="space-y-6">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any bookings associated with this email address.
                  </p>
                  <Link href="/booking">
                    <Button>Make a New Booking</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900">Your Bookings ({bookings.length})</h2>
                {bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">Booking #{booking.id}</CardTitle>
                          <CardDescription>{booking.room}</CardDescription>
                        </div>
                        <div
                          className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {getStatusIcon(booking.status)}
                          <span className="font-semibold text-sm">{booking.status}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Booking Details */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-600">Check-in</p>
                              <p className="font-semibold">
                                {new Date(booking.checkin).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-600">Check-out</p>
                              <p className="font-semibold">
                                {new Date(booking.checkout).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-semibold">{booking.email}</p>
                            </div>
                          </div>
                          {booking.phone && (
                            <div className="flex items-start gap-3">
                              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="font-semibold">{booking.phone}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <p className="text-gray-600">Total Amount</p>
                          <p className="text-2xl font-bold text-primary">${booking.price}</p>
                        </div>
                      </div>

                      {/* Status Message */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        {booking.status === "Confirmed" && (
                          <div className="space-y-2">
                            <p className="font-semibold text-green-700 flex items-center gap-2">
                              <CheckCircle size={18} />
                              Your booking is confirmed!
                            </p>
                            <p className="text-sm text-gray-600">
                              We're looking forward to welcoming you. You'll receive a confirmation email with all the
                              details.
                            </p>
                          </div>
                        )}
                        {booking.status === "Checked In" && (
                          <div className="space-y-2">
                            <p className="font-semibold text-purple-700 flex items-center gap-2">
                              <CheckCircle size={18} />
                              You've checked in!
                            </p>
                            <p className="text-sm text-gray-600">
                              Welcome! We hope you enjoy your stay. If you need anything, please don't hesitate to contact us.
                            </p>
                          </div>
                        )}
                        {booking.status === "Checked Out" && (
                          <div className="space-y-2">
                            <p className="font-semibold text-blue-700 flex items-center gap-2">
                              <CheckCircle size={18} />
                              You've checked out
                            </p>
                            <p className="text-sm text-gray-600">
                              Thank you for staying with us! We hope to see you again soon.
                            </p>
                          </div>
                        )}
                        {booking.status === "Pending" && (
                          <div className="space-y-2">
                            <p className="font-semibold text-yellow-700 flex items-center gap-2">
                              <Clock size={18} />
                              Your booking is being reviewed
                            </p>
                            <p className="text-sm text-gray-600">
                              Our team is reviewing your booking request. You'll receive a confirmation within 24 hours.
                            </p>
                          </div>
                        )}
                        {booking.status === "Cancelled" && (
                          <div className="space-y-2">
                            <p className="font-semibold text-red-700 flex items-center gap-2">
                              <XCircle size={18} />
                              This booking has been cancelled
                            </p>
                            <p className="text-sm text-gray-600">
                              If you have any questions, please contact us directly.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Call Us</p>
                <p className="text-sm text-gray-600">+977 9865366436</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Email Us</p>
                <p className="text-sm text-gray-600">dhampusecolodge@gmail.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Visit Us</p>
                <p className="text-sm text-gray-600">Dhampus Village, Nepal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



