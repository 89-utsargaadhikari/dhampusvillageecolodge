"use client"

import { useState, useEffect, useRef, Fragment } from "react"
import { Trash2, Edit, Plus, X, ChevronDown } from "lucide-react"
import { type Booking } from "@/lib/storage"
import {
  fetchBookings,
  createBooking,
  updateBooking as updateBookingAPI,
  deleteBooking as deleteBookingAPI,
  fetchRooms,
  fetchRoomInventory,
  fetchBusinesses,
  fetchBusinessRates
} from "@/lib/api"
import { BOOKING_SOURCES, BOOKING_STATUSES, CURRENCIES, MEAL_PLANS, OCCUPANCY_TYPES, currencySymbol, defaultOccupancyForRoomType, formatMoney, nightlyRateFromStayTotal, occupancyForPax, parseStayDate, paxForOccupancy, picklistRoomTypes, stayNightsAndDays, stayTotalFromNightlyRate } from "@/lib/hotel"
import {
  findRateCardByKey,
  formatRateValue,
  isPartnerBookingSource,
  lookupPartnerRate,
  matchingRateCardKey,
  occupancyRate,
  partnerCurrencies,
  preferredPartnerCurrency,
  rateCardKey,
  rateCardRatesSummary,
  rateCardSelectLabel,
  type RateCardRow,
} from "@/lib/rate-cards"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminSearch, matchesSearch } from "@/components/admin-search"
import { AdminLoading, useAdminLoader } from "@/components/admin-loading"
import { Spinner } from "@/components/ui/spinner"

type RoomLine = {
  id?: number
  room: string
  roomNumber: string
  occupancy: string
  numberOfGuests: string
  extraBed: boolean
  price: string
}

type BookingGroup = {
  key: string
  groupId: string | null
  members: Booking[]
}

function emptyRoomLine(room = ""): RoomLine {
  return {
    room,
    roomNumber: "",
    occupancy: "SGL",
    numberOfGuests: "1",
    extraBed: false,
    price: "",
  }
}

function applyRateToLine(line: RoomLine, cards: RateCardRow[], mealPlan: string, currency: string): RoomLine {
  const rate = lookupPartnerRate(cards, {
    roomType: line.room,
    mealPlan,
    currency,
    occupancy: line.occupancy,
  })
  if (rate == null) return line
  return { ...line, price: String(rate) }
}

function datesOverlap(checkin: Date, checkout: Date, bookingCheckin: string, bookingCheckout: string) {
  const start = new Date(bookingCheckin)
  const end = new Date(bookingCheckout)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return checkin < end && checkout > start
}

function groupBookings(bookings: Booking[]): BookingGroup[] {
  const seen = new Set<string>()
  const groups: BookingGroup[] = []

  for (const booking of bookings) {
    if (booking.groupId) {
      if (seen.has(booking.groupId)) continue
      seen.add(booking.groupId)
      groups.push({
        key: booking.groupId,
        groupId: booking.groupId,
        members: bookings.filter((item) => item.groupId === booking.groupId),
      })
    } else {
      groups.push({
        key: `single-${booking.id}`,
        groupId: null,
        members: [booking],
      })
    }
  }

  return groups
}

function guestLabel(guest?: string | null) {
  const name = guest?.trim()
  return name || "Unnamed guest"
}

function contactLabel(booking: Booking) {
  const raw = booking.phone?.trim() || booking.email?.trim() || ""
  if (!raw || /^(no|n\/a|na|none|null|-)$/i.test(raw)) return ""
  return raw
}

function sourceLabel(value?: string | null) {
  return BOOKING_SOURCES.find((item) => item.value === value)?.label || value || "—"
}

function mealPlanCode(code?: string | null) {
  if (!code) return "EP"
  if (code === "bed_only") return "EP"
  if (code === "bed_breakfast") return "BB"
  return code
}

function formatDateShort(value?: string | null) {
  if (!value) return null
  const date = parseStayDate(value)
  if (!date) return value
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function formatStayRange(checkin?: string | null, checkout?: string | null) {
  const start = formatDateShort(checkin)
  const end = formatDateShort(checkout)
  if (!start && !end) return "Dates TBD"
  if (start && end) return `${start} → ${end}`
  return start || end || "Dates TBD"
}

function summarizeRooms(members: Booking[]) {
  const buckets = new Map<string, number>()
  for (const member of members) {
    const type = member.room?.trim() || "Room"
    const occ = member.occupancy || ""
    const key = occ ? `${type} · ${occ}` : type
    buckets.set(key, (buckets.get(key) || 0) + 1)
  }
  const summary = [...buckets.entries()].map(([label, count]) => (count > 1 ? `${count} × ${label}` : label))
  const assigned = members.map((member) => member.roomNumber).filter(Boolean) as string[]
  return { summary, assigned, unassigned: members.length - assigned.length }
}

function statusTone(status?: string) {
  if (status === "Checked In") return "bg-emerald-50 text-emerald-800 ring-emerald-100"
  if (status === "Checked Out") return "bg-slate-100 text-slate-700 ring-slate-200"
  if (status === "Cancelled") return "bg-red-50 text-red-700 ring-red-100"
  if (status === "Confirmed") return "bg-green-50 text-green-700 ring-green-100"
  return "bg-amber-50 text-amber-800 ring-amber-100"
}

export default function BookingsManager() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRoomAssignDialogOpen, setIsRoomAssignDialogOpen] = useState(false)
  const [editingMembers, setEditingMembers] = useState<Booking[]>([])
  const [pendingStatusChange, setPendingStatusChange] = useState<{ status: "Pending" | "Cancelled" | "Checked In" | "Checked Out" } | null>(null)
  const [checkInAssignments, setCheckInAssignments] = useState<Record<number, string>>({})
  const emptyForm = {
    guest: "",
    email: "",
    phone: "",
    checkin: "",
    checkout: "",
    status: "Pending" as "Pending" | "Cancelled" | "Checked In" | "Checked Out",
    bookingSource: "phone",
    businessId: "",
    bookingType: "EP",
    currency: "NPR",
    selectedRateCardKey: "",
    rooms: [emptyRoomLine()],
  }
  const [formData, setFormData] = useState(emptyForm)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [partnerSearch, setPartnerSearch] = useState("")
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [partnerRates, setPartnerRates] = useState<RateCardRow[]>([])
  const applyPartnerRatesRef = useRef(false)
  const { loading, run } = useAdminLoader()
  const [saving, setSaving] = useState(false)

  const bookingGroups = groupBookings(bookings)
  const visibleGroups = bookingGroups.filter((group) => {
    if (statusFilter !== "all" && group.members[0]?.status !== statusFilter) return false
    return group.members.some((member) =>
      matchesSearch(
        searchQuery,
        member.guest,
        member.email,
        member.phone,
        member.room,
        member.roomNumber,
        member.bookingSource,
        member.bookingType,
        member.status,
        member.occupancy,
        member.business?.name,
        businesses.find((b: any) => b.id === member.businessId)?.name
      )
    )
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await run(async () => {
        const [bookingsData, roomsData, businessesData, inventoryData] = await Promise.all([
          fetchBookings(),
          fetchRooms(),
          fetchBusinesses().catch(() => []),
          fetchRoomInventory().catch(() => []),
        ])
        setBookings(bookingsData)
        setRooms(roomsData)
        setInventory(inventoryData || [])
        setBusinesses((businessesData || []).filter((b: any) => b.active !== false))
      })
    } catch (error) {
      console.error('Failed to load bookings data:', error)
      alert('Failed to load bookings data')
    }
  }

  useEffect(() => {
    if (!formData.businessId) {
      setPartnerRates([])
      return
    }
    fetchBusinessRates(formData.businessId)
      .then((cards) => setPartnerRates(cards))
      .catch(() => setPartnerRates([]))
  }, [formData.businessId])

  const applyCardToRooms = (rooms: RoomLine[], card: RateCardRow | null) => {
    if (!card) return rooms
    return rooms.map((line) =>
      applyRateToLine({ ...line, room: card.roomType || line.room }, [card], card.mealPlan, card.currency)
    )
  }

  const applyRateCardSelection = (key: string, cards = partnerRates) => {
    const card = findRateCardByKey(cards, key)
    setFormData((prev) => {
      if (!card) return { ...prev, selectedRateCardKey: key }
      return {
        ...prev,
        selectedRateCardKey: key,
        bookingType: card.mealPlan,
        currency: card.currency,
        rooms: applyCardToRooms(prev.rooms, card),
      }
    })
  }

  useEffect(() => {
    if (!partnerRates.length) return
    if (applyPartnerRatesRef.current) {
      setFormData((prev) => {
        const key =
          prev.selectedRateCardKey ||
          matchingRateCardKey(partnerRates, {
            roomType: prev.rooms[0]?.room,
            mealPlan: prev.bookingType,
            currency: preferredPartnerCurrency(partnerRates, prev.currency),
          }) ||
          (partnerRates[0] ? rateCardKey(partnerRates[0]) : "")
        const card = findRateCardByKey(partnerRates, key)
        const currency = card?.currency || preferredPartnerCurrency(partnerRates, prev.currency)
        const mealPlan = card?.mealPlan || prev.bookingType
        return {
          ...prev,
          selectedRateCardKey: key,
          currency,
          bookingType: mealPlan,
          rooms: card ? applyCardToRooms(prev.rooms, card) : prev.rooms.map((line) => applyRateToLine(line, partnerRates, mealPlan, currency)),
        }
      })
      applyPartnerRatesRef.current = false
      return
    }
    setFormData((prev) => {
      const key = matchingRateCardKey(partnerRates, {
        roomType: prev.rooms[0]?.room,
        mealPlan: prev.bookingType,
        currency: prev.currency,
      })
      if (!key || key === prev.selectedRateCardKey) return prev
      return { ...prev, selectedRateCardKey: key }
    })
  }, [partnerRates])

  const applyRatesToRooms = (rooms: RoomLine[], mealPlan: string, currency: string, cards = partnerRates) => {
    if (!cards.length) return rooms
    return rooms.map((line) => applyRateToLine(line, cards, mealPlan, currency))
  }

  const selectedRateCard = findRateCardByKey(partnerRates, formData.selectedRateCardKey)
  const partnerBooking = isPartnerBookingSource(formData.bookingSource)
  const formNights = stayNightsAndDays(formData.checkin, formData.checkout).nights
  const formStayTotal = formData.rooms.reduce(
    (sum, line) => sum + stayTotalFromNightlyRate(line.price, formData.checkin, formData.checkout),
    0
  )

  const updateRoomLine = (index: number, patch: Partial<RoomLine>) => {
    setFormData((prev) => {
      const nextRooms = [...prev.rooms]
      const merged = { ...nextRooms[index], ...patch }
      const card = findRateCardByKey(partnerRates, prev.selectedRateCardKey)
      const shouldApply = Boolean(patch.room || patch.occupancy)
      nextRooms[index] = shouldApply
        ? applyRateToLine(merged, card ? [card] : partnerRates, card?.mealPlan || prev.bookingType, card?.currency || prev.currency)
        : merged
      const nextKey = patch.room
        ? matchingRateCardKey(partnerRates, {
            roomType: patch.room,
            mealPlan: prev.bookingType,
            currency: prev.currency,
          }) || prev.selectedRateCardKey
        : prev.selectedRateCardKey
      return { ...prev, rooms: nextRooms, selectedRateCardKey: nextKey }
    })
  }

  const addRoomLine = () => {
    setFormData((prev) => {
      const next = emptyRoomLine(prev.rooms[0]?.room || rooms[0]?.name || "")
      const card = findRateCardByKey(partnerRates, prev.selectedRateCardKey)
      return {
        ...prev,
        rooms: [...prev.rooms, card ? applyRateToLine({ ...next, room: card.roomType }, [card], card.mealPlan, card.currency) : applyRateToLine(next, partnerRates, prev.bookingType, prev.currency)],
      }
    })
  }

  const setRoomCount = (value: string) => {
    const count = Math.max(1, parseInt(value) || 1)
    setFormData((prev) => {
      const lines = [...prev.rooms]
      while (lines.length < count) {
        lines.push(emptyRoomLine(lines[0]?.room || rooms[0]?.name || ""))
      }
      return { ...prev, rooms: lines.slice(0, count) }
    })
  }

  const removeRoomLine = (index: number) => {
    if (formData.rooms.length === 1) return
    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index),
    }))
  }

  const handleOpenDialog = (booking?: Booking) => {
    if (booking) {
      const members = booking.groupId
        ? bookings.filter((item) => item.groupId === booking.groupId)
        : [booking]
      const primary = members[0]
      setEditingMembers(members)
      applyPartnerRatesRef.current = false
      setFormData({
        guest: primary.guest,
        email: primary.email || "",
        phone: primary.phone || "",
        checkin: primary.checkin,
        checkout: primary.checkout,
        status: (primary.status === "Confirmed" ? "Pending" : primary.status) as typeof emptyForm.status,
        bookingSource: primary.bookingSource || "phone",
        businessId: primary.businessId ? String(primary.businessId) : "",
        bookingType: primary.bookingType === "bed_only" ? "EP" : primary.bookingType === "bed_breakfast" ? "BB" : (primary.bookingType || "EP"),
        currency: primary.currency || "NPR",
        selectedRateCardKey: "",
        rooms: members.map((member) => ({
          id: member.id,
          room: member.room,
          roomNumber: member.roomNumber || "",
          occupancy: member.occupancy || occupancyForPax(Number(member.numberOfGuests) || 1),
          numberOfGuests: String(member.numberOfGuests || paxForOccupancy(member.occupancy)),
          extraBed: Boolean(member.extraBed),
          price: member.price ? String(nightlyRateFromStayTotal(member.price, primary.checkin, primary.checkout)) : "",
        })),
      })
    } else {
      setEditingMembers([])
      applyPartnerRatesRef.current = false
      setFormData({
        ...emptyForm,
        rooms: [emptyRoomLine(rooms[0]?.name || "")],
      })
    }
    setIsDialogOpen(true)
  }

  const sharedBookingFields = () => ({
    guest: formData.guest,
    email: formData.email,
    phone: formData.phone,
    checkin: formData.checkin,
    checkout: formData.checkout,
    status: formData.status,
    bookingSource: formData.bookingSource,
    businessId: formData.businessId || null,
    bookingType: formData.bookingType,
    currency: formData.currency,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const checkinDate = formData.checkin ? new Date(formData.checkin) : null
    const checkoutDate = formData.checkout ? new Date(formData.checkout) : null
    if (checkinDate) checkinDate.setHours(0, 0, 0, 0)
    if (checkoutDate) checkoutDate.setHours(0, 0, 0, 0)

    const assignedNumbers = formData.rooms.map((line) => line.roomNumber).filter(Boolean)
    if (new Set(assignedNumbers).size !== assignedNumbers.length) {
      alert("The same room number cannot be assigned twice in one booking.")
      return
    }

    const editingIds = new Set(formData.rooms.map((line) => line.id).filter(Boolean) as number[])

    if (checkinDate && checkoutDate && checkoutDate <= checkinDate) {
      alert("Check-out date must be after check-in date.")
      return
    }

    if (checkinDate && checkoutDate) {
      for (const line of formData.rooms) {
        if (!line.roomNumber) continue
        const conflictingBooking = bookings.find((booking) => {
          if (editingIds.has(booking.id)) return false
          if (!booking.roomNumber || booking.roomNumber !== line.roomNumber) return false
          if (booking.status === "Cancelled" || booking.status === "Checked Out") return false
          return datesOverlap(checkinDate, checkoutDate, booking.checkin, booking.checkout)
        })
        if (conflictingBooking) {
          alert(
            `Room ${line.roomNumber} is already booked from ${conflictingBooking.checkin} to ${conflictingBooking.checkout}. Guest: ${conflictingBooking.guest}`
          )
          return
        }
      }
    }

    const groupId = formData.rooms.length > 1
      ? (editingMembers.find((member) => member.groupId)?.groupId || `GRP-${Date.now()}`)
      : null

    const roomPayloads = formData.rooms.map((line) => ({
      id: line.id,
      room: line.room,
      roomNumber: line.roomNumber || null,
      occupancy: line.occupancy,
      numberOfGuests: line.numberOfGuests,
      extraBed: line.extraBed,
      price: String(stayTotalFromNightlyRate(line.price, formData.checkin, formData.checkout)),
    }))

    try {
      setSaving(true)
      if (editingMembers.length > 0) {
        const remainingIds = new Set(roomPayloads.map((line) => line.id).filter(Boolean) as number[])
        const removedIds = editingMembers.map((member) => member.id).filter((id) => !remainingIds.has(id))

        for (const line of roomPayloads) {
          const payload = {
            ...sharedBookingFields(),
            room: line.room,
            roomNumber: line.roomNumber,
            occupancy: line.occupancy,
            numberOfGuests: line.numberOfGuests,
            extraBed: line.extraBed,
            price: line.price,
            groupId,
          }
          if (line.id) {
            await updateBookingAPI(line.id, payload)
          } else {
            await createBooking(payload)
          }
        }

        for (const id of removedIds) {
          await deleteBookingAPI(id)
        }
      } else {
        await createBooking({
          ...sharedBookingFields(),
          groupId,
          rooms: roomPayloads,
        })
      }

      await loadData()
      setIsDialogOpen(false)
      setEditingMembers([])
    } catch (error) {
      console.error('Failed to save booking:', error)
      alert(error instanceof Error ? error.message : 'Failed to save booking')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (group: BookingGroup) => {
    const count = group.members.length
    const message = count > 1
      ? `Delete this booking and all ${count} rooms?`
      : "Are you sure you want to delete this booking?"

    if (!confirm(message)) return

    try {
      for (const member of group.members) {
        await deleteBookingAPI(member.id)
      }
      await loadData()
    } catch (error) {
      console.error('Failed to delete booking:', error)
      alert('Failed to delete booking')
    }
  }

  const handleStatusChange = async (
    group: BookingGroup,
    status: "Pending" | "Cancelled" | "Checked In" | "Checked Out" | "Confirmed"
  ) => {
    if (status === "Checked In") {
      const missing = group.members.filter((member) => !member.roomNumber)
      if (missing.length > 0) {
        const initial: Record<number, string> = {}
        group.members.forEach((member) => {
          initial[member.id] = member.roomNumber || ""
        })
        setCheckInAssignments(initial)
        setPendingStatusChange({ status })
        setEditingMembers(group.members)
        setIsRoomAssignDialogOpen(true)
        return
      }
    }

    try {
      await Promise.all(group.members.map((member) => updateBookingAPI(member.id, { status })))
      await loadData()
    } catch (error) {
      console.error('Failed to update booking status:', error)
      alert('Failed to update booking status')
    }
  }

  const getAvailableForCheckIn = (member: Booking) => {
    const selectedRoom = rooms.find((r: any) => r.name === member.room)
    const numbersForType = selectedRoom
      ? inventory.filter((inv: any) => inv.roomTypeId === selectedRoom.id).map((inv: any) => inv.roomNumber as string)
      : inventory.map((inv: any) => inv.roomNumber as string)

    const taken = new Set(
      Object.entries(checkInAssignments)
        .filter(([id, value]) => Number(id) !== member.id && value)
        .map(([, value]) => value)
    )

    const checkin = member.checkin ? new Date(member.checkin) : null
    const checkout = member.checkout ? new Date(member.checkout) : null
    if (checkin) checkin.setHours(0, 0, 0, 0)
    if (checkout) checkout.setHours(0, 0, 0, 0)

    return numbersForType.filter((roomNum) => {
      if (taken.has(roomNum)) return false
      if (!checkin || !checkout) return true
      return !bookings.some((booking) => {
        if (booking.id === member.id) return false
        if (booking.status === "Cancelled" || booking.status === "Checked Out") return false
        if (booking.roomNumber !== roomNum) return false
        return datesOverlap(checkin, checkout, booking.checkin, booking.checkout)
      })
    })
  }

  const handleQuickRoomAssign = async () => {
    if (!pendingStatusChange || editingMembers.length === 0) return
    const missing = editingMembers.filter((member) => !checkInAssignments[member.id])
    if (missing.length > 0) {
      alert("Assign a room number to every room before check-in.")
      return
    }

    try {
      await Promise.all(
        editingMembers.map((member) =>
          updateBookingAPI(member.id, {
            roomNumber: checkInAssignments[member.id],
            status: pendingStatusChange.status,
          })
        )
      )
      await loadData()
      setIsRoomAssignDialogOpen(false)
      setPendingStatusChange(null)
      setEditingMembers([])
      setCheckInAssignments({})
    } catch (error) {
      console.error('Failed to assign room:', error)
      alert('Failed to assign room')
    }
  }

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const renderStatusSelect = (group: BookingGroup, className?: string) => {
    const status = group.members[0]?.status
    return (
      <Select
        value={status}
        onValueChange={(value) =>
          handleStatusChange(group, value as "Confirmed" | "Pending" | "Cancelled" | "Checked In" | "Checked Out")
        }
      >
        <SelectTrigger className={className || "h-8 w-[132px] border-0 bg-transparent shadow-none px-0 focus:ring-0"}>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusTone(status)}`}>
            {status}
          </span>
        </SelectTrigger>
        <SelectContent>
          {BOOKING_STATUSES.map((item) => (
            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
          ))}
          {status === "Confirmed" && <SelectItem value="Confirmed">Confirmed</SelectItem>}
        </SelectContent>
      </Select>
    )
  }

  const totalPax = (members: Booking[]) =>
    members.reduce((sum, member) => sum + (member.numberOfGuests || 1), 0)

  const totalRate = (members: Booking[]) =>
    members.reduce((sum, member) => sum + parseFloat(member.price || "0"), 0)

  if (loading) return <AdminLoading label="Loading bookings..." />

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">Bookings</h2>
          <p className="text-sm text-gray-500">
            {bookingGroups.length} reservation{bookingGroups.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="inline-flex items-center justify-center gap-2">
          <Plus size={18} />
          Add Booking
        </Button>
      </div>

      <AdminSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search guest, room, phone, company..."
      />

      <div className="flex flex-wrap gap-1.5">
        {[{ value: "all", label: "All" }, ...BOOKING_STATUSES].map((item) => {
          const count = item.value === "all"
            ? bookingGroups.length
            : bookingGroups.filter((group) => group.members[0]?.status === item.value).length
          const active = statusFilter === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatusFilter(item.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? "bg-gray-900 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {item.label} {count}
            </button>
          )
        })}
      </div>

      <div className="md:hidden space-y-3">
        {visibleGroups.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
            {searchQuery ? `No bookings match “${searchQuery}”` : "No bookings in this view"}
          </div>
        )}
        {visibleGroups.map((group) => {
          const primary = group.members[0]
          const rooms = summarizeRooms(group.members)
          const contact = contactLabel(primary)
          return (
            <div key={group.key} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{guestLabel(primary.guest)}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {contact || "No contact"} · {sourceLabel(primary.bookingSource)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleOpenDialog(primary)} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800" aria-label="Edit booking">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(group)} className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete booking">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">Stay</p>
                  <p className="font-medium text-gray-800">{formatStayRange(primary.checkin, primary.checkout)}</p>
                  <p className="text-xs text-gray-500">{stayNightsAndDays(primary.checkin, primary.checkout).label}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">Total</p>
                  <p className="font-medium text-gray-800">{formatMoney(totalRate(group.members), primary.currency)}</p>
                  <p className="text-xs text-gray-500">{totalPax(group.members)} pax · {mealPlanCode(primary.bookingType)}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-800">{rooms.summary.join(" · ")}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {rooms.assigned.length > 0
                    ? `Rooms ${rooms.assigned.map((num) => `#${num}`).join("  ")}`
                    : `${group.members.length} ${group.members.length === 1 ? "room" : "rooms"} · assign at check-in`}
                  {rooms.unassigned > 0 && rooms.assigned.length > 0 ? ` · ${rooms.unassigned} unassigned` : ""}
                </p>
              </div>
              <div className="mt-3">{renderStatusSelect(group, "h-8 w-full border-0 bg-transparent shadow-none px-0 focus:ring-0")}</div>
            </div>
          )
        })}
      </div>

      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50/80">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="w-8 px-2 py-3" />
              <th className="px-3 py-3">Guest</th>
              <th className="px-3 py-3">Stay</th>
              <th className="px-3 py-3">Rooms</th>
              <th className="px-3 py-3">Plan</th>
              <th className="px-3 py-3 text-right">Total</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleGroups.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                  {searchQuery ? `No bookings match “${searchQuery}”` : "No bookings in this view"}
                </td>
              </tr>
            )}
            {visibleGroups.map((group) => {
              const primary = group.members[0]
              const rooms = summarizeRooms(group.members)
              const contact = contactLabel(primary)
              const open = expandedKeys.has(group.key)
              return (
                <Fragment key={group.key}>
                  <tr className="align-top hover:bg-gray-50/70">
                    <td className="px-2 py-3">
                      {group.members.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(group.key)}
                          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          aria-label={open ? "Hide room details" : "Show room details"}
                        >
                          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-900">{guestLabel(primary.guest)}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {contact || "No contact"} · {sourceLabel(primary.bookingSource)}
                      </p>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <p className="text-sm text-gray-800">{formatStayRange(primary.checkin, primary.checkout)}</p>
                      <p className="text-xs text-gray-500">{stayNightsAndDays(primary.checkin, primary.checkout).label}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-sm text-gray-800">{rooms.summary.join(" · ")}</p>
                      {rooms.assigned.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {rooms.assigned.map((num) => (
                            <span key={num} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700">
                              #{num}
                            </span>
                          ))}
                          {rooms.unassigned > 0 && (
                            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                              {rooms.unassigned} unassigned
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-gray-400">
                          {group.members.length} {group.members.length === 1 ? "room" : "rooms"} · assign at check-in
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                      {totalPax(group.members)} pax · {mealPlanCode(primary.bookingType)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                      {formatMoney(totalRate(group.members), primary.currency)}
                    </td>
                    <td className="px-3 py-3">{renderStatusSelect(group)}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenDialog(primary)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-800"
                          aria-label="Edit booking"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(group)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete booking"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {open && (
                    <tr className="bg-gray-50/80">
                      <td />
                      <td colSpan={7} className="px-3 pb-4 pt-0">
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
                                <th className="px-3 py-2">Room type</th>
                                <th className="px-3 py-2">Occ.</th>
                                <th className="px-3 py-2">Pax</th>
                                <th className="px-3 py-2">Room #</th>
                                <th className="px-3 py-2 text-right">Stay total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.members.map((member, index) => (
                                <tr key={member.id} className="border-t border-gray-100">
                                  <td className="px-3 py-2 text-gray-800">{member.room || `Room ${index + 1}`}</td>
                                  <td className="px-3 py-2 text-gray-600">{member.occupancy || "—"}</td>
                                  <td className="px-3 py-2 text-gray-600">{member.numberOfGuests || 1}</td>
                                  <td className="px-3 py-2 text-gray-600">{member.roomNumber ? `#${member.roomNumber}` : "—"}</td>
                                  <td className="px-3 py-2 text-right text-gray-800">{formatMoney(member.price, member.currency || primary.currency)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMembers.length > 0 ? "Edit Booking" : "Add New Booking"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guest">Guest Name</Label>
                <Input
                  id="guest"
                  value={formData.guest}
                  onChange={(e) => setFormData({ ...formData, guest: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkin">Check-in</Label>
                <Input
                  id="checkin"
                  type="date"
                  value={formData.checkin}
                  onChange={(e) => setFormData({ ...formData, checkin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout">Check-out</Label>
                <Input
                  id="checkout"
                  type="date"
                  value={formData.checkout}
                  onChange={(e) => setFormData({ ...formData, checkout: e.target.value })}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 -mt-2">
              Stay: <span className="font-semibold">{stayNightsAndDays(formData.checkin, formData.checkout).label}</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bookingSource">Booking Source</Label>
                <Select
                  value={formData.bookingSource}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      bookingSource: value,
                      businessId: isPartnerBookingSource(value) ? formData.businessId : "",
                      selectedRateCardKey: isPartnerBookingSource(value) ? formData.selectedRateCardKey : "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOKING_SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {partnerBooking && (
                <div className="space-y-2">
                  <Label>Company / Agent</Label>
                  <AdminSearch
                    value={partnerSearch}
                    onChange={setPartnerSearch}
                    placeholder="Search partners..."
                    className="mb-2"
                  />
                  <Select
                    value={formData.businessId}
                    onValueChange={(value) => {
                      applyPartnerRatesRef.current = true
                      setFormData((prev) => ({ ...prev, businessId: value, selectedRateCardKey: "" }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select from business partners" />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.filter((business: any) => matchesSearch(partnerSearch, business.name, business.phone, business.contactPerson)).map((business) => (
                        <SelectItem key={business.id} value={String(business.id)}>{business.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {partnerBooking && formData.businessId && (
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 sm:p-4 space-y-3">
                <div className="space-y-2">
                  <Label>Rate card</Label>
                  <Select
                    value={formData.selectedRateCardKey || undefined}
                    onValueChange={applyRateCardSelection}
                    disabled={partnerRates.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={partnerRates.length ? "Select a partner rate card" : "No rate cards for this partner"} />
                    </SelectTrigger>
                    <SelectContent>
                      {partnerRates.map((card) => (
                        <SelectItem key={rateCardKey(card)} value={rateCardKey(card)}>
                          {rateCardSelectLabel(card)} — {rateCardRatesSummary(card)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedRateCard ? (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {OCCUPANCY_TYPES.map((item) => {
                      const rate = occupancyRate(selectedRateCard, item.value)
                      const active = formData.rooms[0]?.occupancy === item.value
                      return (
                        <button
                          key={item.value}
                          type="button"
                          className={`rounded-md border px-2 py-2 text-left ${active ? "border-blue-500 bg-white ring-1 ring-blue-200" : "border-blue-100 bg-white/70"}`}
                          onClick={() => {
                            setFormData((prev) => {
                              const card = findRateCardByKey(partnerRates, prev.selectedRateCardKey)
                              if (!card) return prev
                              return {
                                ...prev,
                                rooms: prev.rooms.map((line) =>
                                  applyRateToLine({ ...line, occupancy: item.value }, [card], card.mealPlan, card.currency)
                                ),
                              }
                            })
                          }}
                        >
                          <div className="text-xs text-gray-500">{item.label}</div>
                          <div className="font-semibold">{formatRateValue(rate, selectedRateCard.currency)}</div>
                        </button>
                      )
                    })}
                  </div>
                ) : partnerRates.length === 0 ? (
                  <p className="text-xs text-amber-700">This partner has no rate cards yet. Add them under Business Partners, or enter a custom rate.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Select a rate card to see single, double, and triple prices.</p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="space-y-2 w-full sm:w-40">
                  <Label htmlFor="roomCount">No. of rooms</Label>
                  <Input
                    id="roomCount"
                    type="number"
                    min="1"
                    value={formData.rooms.length}
                    onChange={(e) => setRoomCount(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Room numbers are assigned at check-in.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addRoomLine} className="shrink-0">
                  <Plus size={16} className="mr-1" />
                  Add room
                </Button>
              </div>

              {formData.rooms.map((line, index) => (
                <div key={line.id || `new-${index}`} className="rounded-lg border border-gray-200 p-3 sm:p-4 space-y-4 bg-gray-50/60">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Room {index + 1}</p>
                    {formData.rooms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRoomLine(index)}
                        className="text-gray-500 hover:text-red-600"
                        aria-label={`Remove room ${index + 1}`}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Room type</Label>
                      <Select
                        value={line.room || undefined}
                        onValueChange={(value) => updateRoomLine(index, { room: value, roomNumber: "" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {picklistRoomTypes(rooms, line.room).map((room) => (
                            <SelectItem key={room.id || room.name} value={room.name}>
                              {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <Label>Occupancy</Label>
                      <Select
                        value={line.occupancy || undefined}
                        onValueChange={(value) => updateRoomLine(index, { occupancy: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Occupancy" />
                        </SelectTrigger>
                        <SelectContent>
                          {OCCUPANCY_TYPES.map((item) => {
                            const card = selectedRateCard || findRateCardByKey(partnerRates, matchingRateCardKey(partnerRates, {
                              roomType: line.room,
                              mealPlan: formData.bookingType,
                              currency: formData.currency,
                            }))
                            const rate = occupancyRate(card, item.value)
                            return (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}{rate != null ? ` · ${formatRateValue(rate, card?.currency || formData.currency)}` : ""}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,0.7fr)_auto_minmax(0,1fr)] gap-4">
                    <div className="min-w-0 space-y-2">
                      <Label>No. of Pax</Label>
                      <Input
                        type="number"
                        min="1"
                        value={line.numberOfGuests}
                        onChange={(e) => {
                          const pax = Math.max(1, parseInt(e.target.value) || 1)
                          updateRoomLine(index, {
                            numberOfGuests: String(pax),
                            occupancy: occupancyForPax(pax, line.occupancy),
                          })
                        }}
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={line.extraBed}
                          onChange={(e) => updateRoomLine(index, { extraBed: e.target.checked })}
                        />
                        Extra bed
                      </label>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <Label>Rate / night</Label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-gray-100 border border-r-0 rounded-l-md text-sm">{currencySymbol(formData.currency)}</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.price}
                          onChange={(e) => updateRoomLine(index, { price: e.target.value })}
                          className="rounded-l-none"
                          placeholder="Nightly rate"
                        />
                      </div>
                      {selectedRateCard && (
                        <p className="text-xs text-muted-foreground">
                          {formatRateValue(occupancyRate(selectedRateCard, line.occupancy), selectedRateCard.currency)} from {rateCardSelectLabel(selectedRateCard)}
                        </p>
                      )}
                      {partnerBooking && formData.businessId && !selectedRateCard && (
                        <p className="text-xs text-muted-foreground">Select a rate card above, or enter a custom amount</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {formNights ? (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
                  <span className="text-gray-600">Stay total ({formNights} night{formNights === 1 ? "" : "s"})</span>
                  <span className="font-semibold text-gray-900">{formatMoney(formStayTotal, formData.currency)}</span>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="min-w-0 space-y-2">
                <Label>Meal Plan</Label>
                <Select
                  value={formData.bookingType}
                  onValueChange={(value) => {
                    const key = matchingRateCardKey(partnerRates, {
                      roomType: formData.rooms[0]?.room,
                      mealPlan: value,
                      currency: formData.currency,
                    })
                    if (key) {
                      applyRateCardSelection(key)
                      return
                    }
                    setFormData((prev) => ({
                      ...prev,
                      bookingType: value,
                      selectedRateCardKey: "",
                      rooms: applyRatesToRooms(prev.rooms, value, prev.currency),
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_PLANS.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => {
                    const key = matchingRateCardKey(partnerRates, {
                      roomType: formData.rooms[0]?.room,
                      mealPlan: formData.bookingType,
                      currency: value,
                    })
                    if (key) {
                      applyRateCardSelection(key)
                      return
                    }
                    setFormData((prev) => ({
                      ...prev,
                      currency: value,
                      selectedRateCardKey: "",
                      rooms: applyRatesToRooms(prev.rooms, prev.bookingType, value),
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(partnerCurrencies(partnerRates).length ? partnerCurrencies(partnerRates) : CURRENCIES.map((item) => item.value)).map((value) => {
                      const item = CURRENCIES.find((currency) => currency.value === value) || { value, label: value }
                      return <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    })}
                    {partnerCurrencies(partnerRates).length > 0 &&
                      CURRENCIES.filter((item) => !partnerCurrencies(partnerRates).includes(item.value)).map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label} (no partner card)</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formData.businessId && partnerRates.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Partner has {partnerCurrencies(partnerRates).join(", ")} rate cards. Pick USD for US guests, NPR for Nepal.
                  </p>
                )}
                {formData.businessId && partnerRates.length === 0 && (
                  <p className="text-xs text-amber-700">This partner has no rate cards yet. Enter a custom rate or add cards first.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as typeof emptyForm.status })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOKING_STATUSES.filter((item) => item.value !== "Checked In" || formData.status === "Checked In").map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Spinner className="size-4" />}
                {saving
                  ? "Saving..."
                  : editingMembers.length > 0
                    ? "Update Booking"
                    : formData.rooms.length > 1
                      ? `Add Booking (${formData.rooms.length} rooms)`
                      : "Add Booking"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRoomAssignDialogOpen} onOpenChange={setIsRoomAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign rooms to check in</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingMembers.length > 0 && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-1 text-sm text-blue-800">
                  <p><span className="font-medium">Guest:</span> {editingMembers[0].guest || "—"}</p>
                  <p><span className="font-medium">Dates:</span> {editingMembers[0].checkin || "—"} to {editingMembers[0].checkout || "—"}</p>
                  <p><span className="font-medium">Rooms:</span> {editingMembers.length}</p>
                </div>

                {editingMembers.map((member, index) => {
                  const available = getAvailableForCheckIn(member)
                  const selected = checkInAssignments[member.id]
                  const numbersToShow = selected && !available.includes(selected) ? [selected, ...available] : available
                  return (
                    <div key={member.id} className="space-y-2">
                      <Label>Room {index + 1} {member.room ? `(${member.room})` : ""}</Label>
                      <Select
                        value={selected || undefined}
                        onValueChange={(value) => setCheckInAssignments((prev) => ({ ...prev, [member.id]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room #" />
                        </SelectTrigger>
                        <SelectContent>
                          {numbersToShow.length > 0 ? (
                            numbersToShow.map((num) => (
                              <SelectItem key={num} value={num}>Room {num}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-rooms" disabled>No rooms available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                })}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsRoomAssignDialogOpen(false)
                      setPendingStatusChange(null)
                      setCheckInAssignments({})
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleQuickRoomAssign} className="flex-1 bg-green-600 hover:bg-green-700">
                    Assign & Check In
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
