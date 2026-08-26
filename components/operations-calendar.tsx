"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  AlertCircle,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"
import { fetchAccountTransactions, fetchBookings, fetchCreditAccounts, fetchRestaurantOrders, fetchRoomInventory, fetchRooms } from "@/lib/api"
import { formatMoney, mealPlanLabel, occupancyLabel, stayNightsAndDays } from "@/lib/hotel"
import { AdminLoading, AdminRefreshHint, useAdminLoader } from "@/components/admin-loading"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ViewMode = "rooms" | "week" | "month"
type Layer = "bookings" | "restaurant" | "payments" | "credits"

type RoomRow = {
  roomNumber: string
  roomType: string
  floor?: string | null
}

type Stay = {
  id: number
  guest: string
  room: string
  roomNumber: string
  checkin: string
  checkout: string
  status: string
  occupancy?: string | null
  mealPlan?: string | null
  currency?: string | null
  price?: string | null
  phone?: string | null
  email?: string | null
  businessName?: string | null
  numberOfGuests?: number | null
  extraBed?: boolean
  groupId?: string | null
  bookingId?: string | null
}

type DayEvent = {
  id: string
  date: string
  kind: "checkin" | "checkout" | "order" | "income" | "expense" | "credit-due" | "credit-pay"
  title: string
  detail: string
  amount?: number
  currency?: string
  status?: string
  overdue?: boolean
  stay?: Stay
}

const LAYERS: { id: Layer; label: string }[] = [
  { id: "bookings", label: "Bookings" },
  { id: "restaurant", label: "Restaurant" },
  { id: "payments", label: "Payments" },
  { id: "credits", label: "Credits" },
]

const STATUS_BAR: Record<string, string> = {
  Pending: "bg-amber-500 text-white",
  Confirmed: "bg-sky-600 text-white",
  "Checked In": "bg-emerald-600 text-white",
  "Checked Out": "bg-slate-400 text-white",
  Cancelled: "bg-white text-rose-500 border border-dashed border-rose-300",
}

const KIND_PILL: Record<DayEvent["kind"], string> = {
  checkin: "bg-emerald-100 text-emerald-800",
  checkout: "bg-sky-100 text-sky-800",
  order: "bg-amber-100 text-amber-900",
  income: "bg-violet-100 text-violet-800",
  expense: "bg-orange-100 text-orange-800",
  "credit-due": "bg-rose-100 text-rose-800",
  "credit-pay": "bg-fuchsia-100 text-fuchsia-800",
}

const KIND_LABEL: Record<DayEvent["kind"], string> = {
  checkin: "Check-in",
  checkout: "Check-out",
  order: "Restaurant",
  income: "Income",
  expense: "Expense",
  "credit-due": "Credit due",
  "credit-pay": "Credit payment",
}

function toDateKey(value: string | Date | null | undefined) {
  if (!value) return ""
  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function parseKey(key: string) {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function addDays(key: string, amount: number) {
  const date = parseKey(key)
  date.setDate(date.getDate() + amount)
  return toDateKey(date)
}

function todayKey() {
  return toDateKey(new Date())
}

function rangeKeys(start: string, count: number) {
  return Array.from({ length: count }, (_, index) => addDays(start, index))
}

function daysBetween(start: string, end: string) {
  return Math.round((parseKey(end).getTime() - parseKey(start).getTime()) / 86_400_000)
}

function formatDay(key: string, style: "short" | "long" | "weekday" | "monthDay" = "short") {
  const date = parseKey(key)
  if (style === "long") return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  if (style === "weekday") return date.toLocaleDateString(undefined, { weekday: "short" })
  if (style === "monthDay") return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  return String(date.getDate())
}

function guestName(value?: string | null) {
  const name = value?.trim()
  return name || "Unnamed guest"
}

function stayNights(stay: Stay) {
  if (!stay.checkin) return []
  const start = stay.checkin
  const end = stay.checkout && stay.checkout > stay.checkin ? stay.checkout : addDays(stay.checkin, 1)
  const nights: string[] = []
  let cursor = start
  while (cursor < end) {
    nights.push(cursor)
    cursor = addDays(cursor, 1)
    if (nights.length > 400) break
  }
  return nights
}

function isCancelled(status?: string | null) {
  return status === "Cancelled"
}

function isActiveStay(stay: Stay) {
  return !isCancelled(stay.status)
}

function occupiedOn(stay: Stay, date: string) {
  return isActiveStay(stay) && stayNights(stay).includes(date)
}

function overlapsRange(stay: Stay, start: string, endExclusive: string) {
  if (!stay.checkin) return false
  const last = stay.checkout && stay.checkout > stay.checkin ? stay.checkout : addDays(stay.checkin, 1)
  return stay.checkin < endExclusive && last > start
}

function statusBarClass(status?: string | null) {
  return STATUS_BAR[status || ""] || "bg-slate-500 text-white"
}

function countPhrase(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

function naturalRoomSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
}

function layerForKind(kind: DayEvent["kind"]): Layer {
  if (kind === "checkin" || kind === "checkout") return "bookings"
  if (kind === "order") return "restaurant"
  if (kind === "credit-due" || kind === "credit-pay") return "credits"
  return "payments"
}

function eventMatchesQuery(event: DayEvent, query: string) {
  if (!query) return true
  const haystack = `${event.title} ${event.detail} ${event.status || ""}`.toLowerCase()
  return haystack.includes(query)
}

function stayMatchesQuery(stay: Stay, query: string) {
  if (!query) return true
  const haystack = `${stay.guest} ${stay.room} ${stay.roomNumber} ${stay.businessName || ""} ${stay.phone || ""} ${stay.bookingId || ""}`.toLowerCase()
  return haystack.includes(query)
}

function occupancyTone(ratio: number) {
  if (ratio >= 0.9) return "bg-rose-500"
  if (ratio >= 0.7) return "bg-amber-500"
  if (ratio >= 0.4) return "bg-emerald-500"
  return "bg-emerald-300"
}

function stayEnd(stay: Stay) {
  return stay.checkout && stay.checkout > stay.checkin ? stay.checkout : stay.checkin ? addDays(stay.checkin, 1) : ""
}

function collapseEvents(events: DayEvent[]) {
  const groups = new Map<string, DayEvent[]>()
  for (const event of events) {
    const key = event.stay?.groupId || `${event.kind}|${event.title}|${event.date}|${event.detail}`
    const list = groups.get(key) || []
    list.push(event)
    groups.set(key, list)
  }
  return [...groups.values()].map((members) => {
    if (members.length === 1) return members[0]
    return {
      ...members[0],
      title: `${members[0].title} · ${members.length} rooms`,
      detail: members[0].detail.replace("Unassigned", `${members.length} rooms unassigned`),
    }
  })
}

function collapseUnassigned(stays: Stay[]) {
  const groups = new Map<string, Stay[]>()
  for (const stay of stays) {
    const key = stay.groupId || `${stay.guest}|${stay.checkin}|${stay.checkout}|${stay.room}`
    const list = groups.get(key) || []
    list.push(stay)
    groups.set(key, list)
  }
  return [...groups.values()].map((members) => {
    const first = members[0]
    if (members.length === 1) return first
    return {
      ...first,
      guest: `${first.guest} · ${members.length} rooms`,
    }
  })
}

function assignLanes(stays: Stay[]) {
  const sorted = [...stays].sort((a, b) => (a.checkin || "").localeCompare(b.checkin || "") || a.id - b.id)
  const lanes: Stay[][] = []
  const laneOf = new Map<number, number>()
  for (const stay of sorted) {
    const end = stayEnd(stay)
    let lane = lanes.findIndex((items) => items.every((other) => stayEnd(other) <= stay.checkin || other.checkin >= end))
    if (lane === -1) {
      lanes.push([stay])
      lane = lanes.length - 1
    } else {
      lanes[lane].push(stay)
    }
    laneOf.set(stay.id, lane)
  }
  return { laneCount: Math.max(1, lanes.length), laneOf }
}

export default function OperationsCalendar() {
  const [view, setView] = useState<ViewMode>("rooms")
  const [anchor, setAnchor] = useState(todayKey)
  const [selectedKey, setSelectedKey] = useState(todayKey)
  const [rangeDays, setRangeDays] = useState(14)
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    bookings: true,
    restaurant: true,
    payments: true,
    credits: true,
  })
  const [showCancelled, setShowCancelled] = useState(false)
  const [roomType, setRoomType] = useState("all")
  const [query, setQuery] = useState("")
  const { loading, refreshing, run } = useAdminLoader()
  const [stays, setStays] = useState<Stay[]>([])
  const [rooms, setRooms] = useState<RoomRow[]>([])
  const [events, setEvents] = useState<DayEvent[]>([])
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null)

  const load = useCallback(async () => {
    try {
      await run(async () => {
      const [bookings, orders, transactions, credits, inventory, roomTypes] = await Promise.all([
        fetchBookings().catch(() => []),
        fetchRestaurantOrders().catch(() => []),
        fetchAccountTransactions().catch(() => []),
        fetchCreditAccounts().catch(() => []),
        fetchRoomInventory().catch(() => []),
        fetchRooms().catch(() => []),
      ])

      const nextStays: Stay[] = (bookings || []).map((booking: any) => ({
        id: booking.id,
        guest: guestName(booking.guest),
        room: booking.room || "Unassigned",
        roomNumber: booking.roomNumber || "",
        checkin: toDateKey(booking.checkin),
        checkout: toDateKey(booking.checkout),
        status: booking.status || "Pending",
        occupancy: booking.occupancy,
        mealPlan: booking.bookingType,
        currency: booking.currency,
        price: booking.price,
        phone: booking.phone,
        email: booking.email,
        businessName: booking.business?.name || null,
        numberOfGuests: booking.numberOfGuests,
        extraBed: Boolean(booking.extraBed),
        groupId: booking.groupId,
        bookingId: booking.bookingId,
      }))

      const nextRooms: RoomRow[] = []
      if (inventory?.length) {
        for (const item of inventory) {
          nextRooms.push({
            roomNumber: String(item.roomNumber),
            roomType: item.roomType || "Room",
            floor: item.floor,
          })
        }
      } else {
        for (const room of roomTypes || []) {
          const numbers = Array.isArray(room.roomNumbers)
            ? room.roomNumbers
            : String(room.roomNumbers || "").split(",").map((value: string) => value.trim()).filter(Boolean)
          for (const number of numbers) {
            nextRooms.push({ roomNumber: number, roomType: room.name || "Room" })
          }
        }
      }

      const known = new Set(nextRooms.map((room) => room.roomNumber))
      for (const stay of nextStays) {
        if (stay.roomNumber && !known.has(stay.roomNumber)) {
          nextRooms.push({ roomNumber: stay.roomNumber, roomType: stay.room || "Other" })
          known.add(stay.roomNumber)
        }
      }

      nextRooms.sort((a, b) => a.roomType.localeCompare(b.roomType) || naturalRoomSort(a.roomNumber, b.roomNumber))

      const nextEvents: DayEvent[] = []
      for (const stay of nextStays) {
        if (stay.checkin) {
          nextEvents.push({
            id: `in-${stay.id}`,
            date: stay.checkin,
            kind: "checkin",
            title: stay.guest,
            detail: `${stay.roomNumber ? `Room ${stay.roomNumber}` : "Unassigned"} · ${stay.room} · ${stay.status}`,
            amount: parseFloat(stay.price || "0") || 0,
            currency: stay.currency || "NPR",
            status: stay.status,
            stay,
          })
        }
        if (stay.checkout) {
          nextEvents.push({
            id: `out-${stay.id}`,
            date: stay.checkout,
            kind: "checkout",
            title: stay.guest,
            detail: `${stay.roomNumber ? `Room ${stay.roomNumber}` : "Unassigned"} · ${stayNightsAndDays(stay.checkin, stay.checkout).label}`,
            amount: parseFloat(stay.price || "0") || 0,
            currency: stay.currency || "NPR",
            status: stay.status,
            stay,
          })
        }
      }

      for (const order of orders || []) {
        const date = toDateKey(order.orderDate || order.createdAt)
        if (!date) continue
        nextEvents.push({
          id: `order-${order.id}`,
          date,
          kind: "order",
          title: order.orderNumber || `Order #${order.id}`,
          detail: `${order.guestName || "Walk-in"}${order.roomNumber ? ` · Room ${order.roomNumber}` : ""} · ${order.paymentStatus || "unpaid"}`,
          amount: order.total || 0,
          currency: "NPR",
          status: order.status,
        })
        if (order.paymentStatus === "paid") {
          nextEvents.push({
            id: `order-pay-${order.id}`,
            date,
            kind: "income",
            title: "Restaurant payment",
            detail: `${order.orderNumber} · ${order.paymentMethod || "paid"}`,
            amount: order.total || 0,
            currency: "NPR",
            status: order.paymentStatus,
          })
        }
      }

      for (const tx of transactions || []) {
        const date = toDateKey(tx.dateAD || tx.date)
        if (!date) continue
        nextEvents.push({
          id: `tx-${tx.id}`,
          date,
          kind: tx.type === "expense" ? "expense" : "income",
          title: `${tx.type === "expense" ? "Expense" : "Income"} · ${tx.category || "accounts"}`,
          detail: tx.description || tx.paymentMethod || "Accounts",
          amount: tx.amountNPR || tx.amount || 0,
          currency: "NPR",
          status: tx.type,
        })
      }

      const today = todayKey()
      for (const account of credits || []) {
        for (const payment of account.payments || []) {
          const date = toDateKey(payment.paymentDate)
          if (!date) continue
          nextEvents.push({
            id: `credit-pay-${payment.id}`,
            date,
            kind: "credit-pay",
            title: `Credit payment · ${account.guestName}`,
            detail: payment.paymentMethod || "credit",
            amount: payment.amount || 0,
            currency: "NPR",
            status: account.status,
          })
        }
        const due = toDateKey(account.dueDate)
        if (due && account.status !== "paid") {
          nextEvents.push({
            id: `credit-due-${account.id}`,
            date: due,
            kind: "credit-due",
            title: `Credit due · ${account.guestName}`,
            detail: `Outstanding ${formatMoney(account.outstandingBalance, "NPR")}`,
            amount: account.outstandingBalance || 0,
            currency: "NPR",
            status: account.status,
            overdue: due < today,
          })
        }
      }

      setStays(nextStays)
      setRooms(nextRooms)
      setEvents(nextEvents)
      })
    } catch (error) {
      console.error("Failed to load calendar", error)
    }
  }, [run])

  useEffect(() => {
    load()
  }, [load])

  const search = query.trim().toLowerCase()
  const roomTypes = useMemo(
    () => Array.from(new Set(rooms.map((room) => room.roomType))).sort((a, b) => a.localeCompare(b)),
    [rooms],
  )

  const visibleRooms = useMemo(
    () => rooms.filter((room) => roomType === "all" || room.roomType === roomType),
    [rooms, roomType],
  )

  const visibleStays = useMemo(
    () => stays.filter((stay) => (showCancelled || !isCancelled(stay.status)) && stayMatchesQuery(stay, search)),
    [stays, showCancelled, search],
  )

  const visibleEvents = useMemo(
    () => events.filter((event) => {
      if (!layers[layerForKind(event.kind)]) return false
      if ((event.kind === "checkin" || event.kind === "checkout") && event.stay && isCancelled(event.stay.status) && !showCancelled) return false
      return eventMatchesQuery(event, search)
    }),
    [events, layers, showCancelled, search],
  )

  const days = useMemo(() => {
    if (view === "month") {
      const monthDate = parseKey(anchor.slice(0, 7) + "-01")
      const start = new Date(monthDate)
      start.setDate(1 - start.getDay())
      return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(start)
        date.setDate(start.getDate() + index)
        return toDateKey(date)
      })
    }
    if (view === "week") {
      const start = addDays(anchor, -parseKey(anchor).getDay())
      return rangeKeys(start, 7)
    }
    return rangeKeys(anchor, rangeDays)
  }, [view, anchor, rangeDays])

  const visibleStart = days[0]
  const visibleEnd = addDays(days[days.length - 1], 1)
  const monthPrefix = anchor.slice(0, 7)
  const today = todayKey()
  const totalRooms = visibleRooms.length || 1

  const occupiedByDate = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const stay of stays) {
      if (!isActiveStay(stay) || !stay.roomNumber) continue
      if (roomType !== "all") {
        const row = rooms.find((room) => room.roomNumber === stay.roomNumber)
        if (row && row.roomType !== roomType) continue
      }
      for (const night of stayNights(stay)) {
        const set = map.get(night) || new Set<string>()
        set.add(stay.roomNumber)
        map.set(night, set)
      }
    }
    return map
  }, [stays, rooms, roomType])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, DayEvent[]>()
    for (const event of visibleEvents) {
      const list = map.get(event.date) || []
      list.push(event)
      map.set(event.date, list)
    }
    return map
  }, [visibleEvents])

  const selectedEvents = eventsByDate.get(selectedKey) || []
  const inHouse = visibleStays.filter((stay) => occupiedOn(stay, selectedKey) && stay.roomNumber)
  const unassignedSelected = visibleStays.filter((stay) => !stay.roomNumber && occupiedOn(stay, selectedKey) && stay.checkin !== selectedKey)
  const undated = visibleStays.filter((stay) => !stay.checkin)

  const todayCheckins = stays.filter((stay) => isActiveStay(stay) && stay.checkin === today).length
  const todayCheckouts = stays.filter((stay) => isActiveStay(stay) && stay.checkout === today).length
  const todayOccupied = occupiedByDate.get(today)?.size || 0
  const occupancyPct = Math.round((todayOccupied / totalRooms) * 100)

  const rangeCheckins = visibleEvents.filter((event) => event.kind === "checkin" && days.includes(event.date)).length
  const rangeOrders = visibleEvents.filter((event) => event.kind === "order" && days.includes(event.date)).length
  const rangeMoney = visibleEvents
    .filter((event) => (event.kind === "income" || event.kind === "credit-pay") && days.includes(event.date))
    .reduce((sum, event) => sum + (event.amount || 0), 0)

  const groupedRooms = useMemo(() => {
    const groups: { type: string; rooms: RoomRow[] }[] = []
    for (const room of visibleRooms) {
      const last = groups[groups.length - 1]
      if (last && last.type === room.roomType) last.rooms.push(room)
      else groups.push({ type: room.roomType, rooms: [room] })
    }
    return groups
  }, [visibleRooms])

  const unassignedStays = collapseUnassigned(
    visibleStays.filter((stay) => !stay.roomNumber && stay.checkin && overlapsRange(stay, visibleStart, visibleEnd) && (roomType === "all" || stay.room === roomType)),
  )
  const todayUnassigned = stays.filter((stay) => isActiveStay(stay) && !stay.roomNumber && stay.checkin === today).length

  const heading = view === "month"
    ? parseKey(`${monthPrefix}-01`).toLocaleString(undefined, { month: "long", year: "numeric" })
    : view === "week"
      ? `${formatDay(days[0], "monthDay")} – ${formatDay(days[days.length - 1], "monthDay")}`
      : `${formatDay(days[0], "monthDay")} – ${formatDay(days[days.length - 1], "monthDay")}`

  const goToday = () => {
    const key = todayKey()
    setSelectedKey(key)
    if (view === "month") setAnchor(key)
    else if (view === "week") setAnchor(addDays(key, -parseKey(key).getDay()))
    else setAnchor(key)
  }

  const goPrev = () => {
    if (view === "month") setAnchor(addDays(`${monthPrefix}-01`, -1).slice(0, 7) + "-01")
    else if (view === "week") setAnchor(addDays(days[0], -7))
    else setAnchor(addDays(anchor, -rangeDays))
  }

  const goNext = () => {
    if (view === "month") {
      const next = parseKey(`${monthPrefix}-01`)
      next.setMonth(next.getMonth() + 1)
      setAnchor(toDateKey(next))
    } else if (view === "week") {
      setAnchor(addDays(days[0], 7))
    } else {
      setAnchor(addDays(anchor, rangeDays))
    }
  }

  const toggleLayer = (id: Layer) => {
    setLayers((current) => ({ ...current, [id]: !current[id] }))
  }

  if (loading) return <AdminLoading label="Loading calendar..." />

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Calendar</h2>
            <AdminRefreshHint show={refreshing} />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Today you have {countPhrase(todayCheckins, "check-in", "check-ins")}, {countPhrase(todayCheckouts, "check-out", "check-outs")} and {countPhrase(todayOccupied, "room", "rooms")} occupied.
            {todayUnassigned > 0 ? ` ${todayUnassigned} still need a room number.` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border bg-white p-1">
            {(["rooms", "week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setView(mode)
                  if (mode === "week") setAnchor(addDays(selectedKey, -parseKey(selectedKey).getDay()))
                  if (mode === "month") setAnchor(selectedKey)
                  if (mode === "rooms") setAnchor(selectedKey)
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium capitalize",
                  view === mode ? "bg-green-700 text-white" : "text-gray-600 hover:bg-gray-50",
                )}
              >
                {mode === "rooms" ? "Rooms" : mode === "week" ? "Week" : "Month"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous">
              <ChevronLeft size={18} />
            </Button>
            <div className="min-w-[168px] text-center text-sm font-semibold text-gray-900">{heading}</div>
            <Button variant="outline" size="icon" onClick={goNext} aria-label="Next">
              <ChevronRight size={18} />
            </Button>
          </div>
          <Button variant="outline" onClick={goToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard icon={LogIn} label="Check-ins today" value={String(todayCheckins)} hint={`${rangeCheckins} in this view`} />
        <StatCard icon={LogOut} label="Check-outs today" value={String(todayCheckouts)} hint={`${occupancyPct}% occupancy tonight`} />
        <StatCard icon={BedDouble} label="Rooms occupied" value={`${todayOccupied}/${visibleRooms.length}`} hint="Active stays tonight" />
        <StatCard icon={Wallet} label="Money in this view" value={formatMoney(rangeMoney, "NPR")} hint={`${rangeOrders} restaurant orders`} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => toggleLayer(layer.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold",
                layers[layer.id] ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500",
              )}
            >
              {layer.label}
            </button>
          ))}
          <label className="flex items-center gap-2 text-xs text-gray-600 px-2">
            <input type="checkbox" checked={showCancelled} onChange={(event) => setShowCancelled(event.target.checked)} />
            Show cancelled
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {view === "rooms" && (
            <select
              value={rangeDays}
              onChange={(event) => setRangeDays(Number(event.target.value))}
              className="h-9 rounded-md border bg-white px-2 text-sm"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={21}>21 days</option>
              <option value={31}>31 days</option>
            </select>
          )}
          <select
            value={roomType}
            onChange={(event) => setRoomType(event.target.value)}
            className="h-9 rounded-md border bg-white px-2 text-sm"
          >
            <option value="all">All room types</option>
            {roomTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guest, room, company" className="pl-8 w-[220px]" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
        <Legend swatch="bg-amber-500" label="Pending" />
        <Legend swatch="bg-sky-600" label="Confirmed" />
        <Legend swatch="bg-emerald-600" label="Checked in" />
        <Legend swatch="bg-slate-400" label="Checked out" />
        <Legend swatch="bg-amber-200" label="Restaurant" />
        <Legend swatch="bg-rose-200" label="Credit due" />
      </div>

      {undated.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">{undated.length} booking{undated.length === 1 ? "" : "s"} without dates</span>
          <span className="text-amber-800"> — {undated.slice(0, 4).map((stay) => stay.guest).join(", ")}{undated.length > 4 ? "…" : ""}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
          <div className="min-w-0">
            {view === "rooms" && (
              <RoomsTimeline
                days={days}
                groups={groupedRooms}
                stays={visibleStays}
                unassigned={unassignedStays}
                eventsByDate={eventsByDate}
                occupiedByDate={occupiedByDate}
                totalRooms={visibleRooms.length}
                selectedKey={selectedKey}
                layers={layers}
                onSelectDate={setSelectedKey}
                onSelectStay={setSelectedStay}
              />
            )}
            {view === "month" && (
              <MonthGrid
                days={days}
                monthPrefix={monthPrefix}
                eventsByDate={eventsByDate}
                occupiedByDate={occupiedByDate}
                totalRooms={visibleRooms.length}
                selectedKey={selectedKey}
                onSelectDate={setSelectedKey}
              />
            )}
            {view === "week" && (
              <WeekBoard
                days={days}
                eventsByDate={eventsByDate}
                occupiedByDate={occupiedByDate}
                stays={visibleStays}
                totalRooms={visibleRooms.length}
                selectedKey={selectedKey}
                onSelectDate={setSelectedKey}
                onSelectStay={setSelectedStay}
              />
            )}
          </div>

          <DayPanel
            date={selectedKey}
            events={selectedEvents}
            inHouse={inHouse}
            unassigned={unassignedSelected}
            occupied={occupiedByDate.get(selectedKey)?.size || 0}
            totalRooms={visibleRooms.length}
            onSelectStay={setSelectedStay}
          />
        </div>

      <Dialog open={Boolean(selectedStay)} onOpenChange={(open) => { if (!open) setSelectedStay(null) }}>
        <DialogContent className="sm:max-w-md">
          {selectedStay && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedStay.guest}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", statusBarClass(selectedStay.status))}>
                  {selectedStay.status}
                </div>
                <DetailRow label="Room" value={selectedStay.roomNumber ? `${selectedStay.roomNumber} · ${selectedStay.room}` : `${selectedStay.room} · unassigned`} />
                <DetailRow label="Stay" value={`${selectedStay.checkin || "—"} → ${selectedStay.checkout || "—"} · ${stayNightsAndDays(selectedStay.checkin, selectedStay.checkout).label}`} />
                <DetailRow label="Meal plan" value={mealPlanLabel(selectedStay.mealPlan)} />
                <DetailRow label="Occupancy" value={occupancyLabel(selectedStay.occupancy)} />
                <DetailRow label="Guests" value={String(selectedStay.numberOfGuests || "—")} />
                <DetailRow label="Company" value={selectedStay.businessName || "N/A"} />
                <DetailRow label="Contact" value={selectedStay.phone || selectedStay.email || "—"} />
                <DetailRow label="Rate" value={formatMoney(selectedStay.price, selectedStay.currency || "NPR")} />
                {selectedStay.bookingId && <DetailRow label="Booking ID" value={selectedStay.bookingId} />}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof LogIn; label: string; value: string; hint: string }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
        <Icon size={14} />
        {label}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{hint}</p>
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-sm", swatch)} />
      {label}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}

function RoomsTimeline({
  days,
  groups,
  stays,
  unassigned,
  eventsByDate,
  occupiedByDate,
  totalRooms,
  selectedKey,
  layers,
  onSelectDate,
  onSelectStay,
}: {
  days: string[]
  groups: { type: string; rooms: RoomRow[] }[]
  stays: Stay[]
  unassigned: Stay[]
  eventsByDate: Map<string, DayEvent[]>
  occupiedByDate: Map<string, Set<string>>
  totalRooms: number
  selectedKey: string
  layers: Record<Layer, boolean>
  onSelectDate: (key: string) => void
  onSelectStay: (stay: Stay) => void
}) {
  const today = todayKey()
  const cellMin = days.length > 16 ? 56 : 72

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: 160 + days.length * cellMin }}>
          <div className="grid" style={{ gridTemplateColumns: `160px repeat(${days.length}, minmax(${cellMin}px, 1fr))` }}>
            <div className="sticky left-0 z-20 bg-gray-50 border-b border-r px-3 py-2 text-xs font-semibold text-gray-500">Room</div>
            {days.map((day) => {
              const occupied = occupiedByDate.get(day)?.size || 0
              const ratio = totalRooms ? occupied / totalRooms : 0
              const dayEvents = eventsByDate.get(day) || []
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onSelectDate(day)}
                  className={cn(
                    "border-b border-r px-1 py-1.5 text-center",
                    selectedKey === day ? "bg-green-50" : "bg-gray-50",
                    day === today ? "ring-2 ring-inset ring-green-600" : "",
                  )}
                >
                  <div className="text-[10px] uppercase text-gray-400">{formatDay(day, "weekday")}</div>
                  <div className={cn("text-sm font-semibold", day === today ? "text-green-700" : "text-gray-900")}>{formatDay(day)}</div>
                  <div className="mt-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div className={cn("h-full", occupancyTone(ratio))} style={{ width: `${Math.round(ratio * 100)}%` }} />
                  </div>
                  <div className="mt-1 flex justify-center gap-0.5 min-h-[8px]">
                    {layers.restaurant && dayEvents.some((event) => event.kind === "order") && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                    {layers.payments && dayEvents.some((event) => event.kind === "income" || event.kind === "expense") && <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />}
                    {layers.credits && dayEvents.some((event) => event.kind === "credit-due") && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                  </div>
                </button>
              )
            })}
          </div>

          {groups.map((group) => (
            <TimelineSection
              key={group.type}
              title={group.type}
              days={days}
              selectedKey={selectedKey}
              today={today}
              rows={group.rooms.map((room) => ({
                key: room.roomNumber,
                label: room.roomNumber,
                hint: room.floor ? `Floor ${room.floor}` : group.type,
                stays: stays.filter((stay) => stay.roomNumber === room.roomNumber),
              }))}
              onSelectDate={onSelectDate}
              onSelectStay={onSelectStay}
            />
          ))}

          {unassigned.length > 0 && (
            <TimelineSection
              title="Unassigned"
              days={days}
              selectedKey={selectedKey}
              today={today}
              rows={[{
                key: "unassigned",
                label: `${unassigned.length} group${unassigned.length === 1 ? "" : "s"}`,
                hint: "Assign on check-in",
                stays: unassigned,
              }]}
              onSelectDate={onSelectDate}
              onSelectStay={onSelectStay}
            />
          )}

          {groups.length === 0 && unassigned.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">No room numbers yet. Add them under Room Numbers.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function TimelineSection({
  title,
  days,
  rows,
  selectedKey,
  today,
  onSelectDate,
  onSelectStay,
}: {
  title: string
  days: string[]
  rows: { key: string; label: string; hint: string; stays: Stay[] }[]
  selectedKey: string
  today: string
  onSelectDate: (key: string) => void
  onSelectStay: (stay: Stay) => void
}) {
  const start = days[0]
  const end = addDays(days[days.length - 1], 1)

  return (
    <div>
      <div className="sticky left-0 z-10 bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      {rows.map((row) => {
        const visible = row.stays.filter((stay) => stay.checkin && overlapsRange(stay, start, end))
        const { laneCount, laneOf } = assignLanes(visible)
        return (
          <div
            key={row.key}
            className="grid border-b"
            style={{ gridTemplateColumns: `160px minmax(0, 1fr)` }}
          >
            <div className="sticky left-0 z-10 bg-white border-r px-3 py-2">
              <p className="text-sm font-semibold text-gray-900">{row.label}</p>
              <p className="text-[11px] text-gray-500 truncate">{row.hint}</p>
            </div>
            <div className="relative" style={{ minHeight: laneCount * 34 + 14 }}>
              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onSelectDate(day)}
                    className={cn(
                      "border-r h-full",
                      selectedKey === day ? "bg-green-50/80" : "bg-white",
                      day === today ? "bg-green-50" : "",
                    )}
                  />
                ))}
              </div>
              {visible.map((stay) => {
                const last = stayEnd(stay)
                const barStart = stay.checkin > start ? stay.checkin : start
                const barEnd = last < end ? last : end
                const startIndex = Math.max(0, daysBetween(start, barStart))
                const span = Math.max(1, daysBetween(barStart, barEnd))
                const continuesLeft = stay.checkin < start
                const continuesRight = last > end
                const lane = laneOf.get(stay.id) || 0
                return (
                  <button
                    key={stay.id}
                    type="button"
                    title={`${stay.guest} · ${stay.status}`}
                    onClick={() => onSelectStay(stay)}
                    className={cn(
                      "absolute h-8 rounded-md px-2 text-left text-[11px] font-semibold shadow-sm truncate hover:brightness-95",
                      statusBarClass(stay.status),
                    )}
                    style={{
                      top: 6 + lane * 34,
                      left: `calc(${(startIndex / days.length) * 100}% + 3px)`,
                      width: `calc(${(span / days.length) * 100}% - 6px)`,
                    }}
                  >
                    {continuesLeft ? "‹ " : ""}{stay.guest}{continuesRight ? " ›" : ""}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MonthGrid({
  days,
  monthPrefix,
  eventsByDate,
  occupiedByDate,
  totalRooms,
  selectedKey,
  onSelectDate,
}: {
  days: string[]
  monthPrefix: string
  eventsByDate: Map<string, DayEvent[]>
  occupiedByDate: Map<string, Set<string>>
  totalRooms: number
  selectedKey: string
  onSelectDate: (key: string) => void
}) {
  const today = todayKey()

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50 text-xs font-semibold text-gray-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="px-2 py-2 text-center">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = day.startsWith(monthPrefix)
          const occupied = occupiedByDate.get(day)?.size || 0
          const dayEvents = eventsByDate.get(day) || []
          const checkins = dayEvents.filter((event) => event.kind === "checkin").length
          const checkouts = dayEvents.filter((event) => event.kind === "checkout").length
          const extras = dayEvents.filter((event) => event.kind !== "checkin" && event.kind !== "checkout")
          const ratio = totalRooms ? occupied / totalRooms : 0
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                "min-h-[108px] border-t border-r p-2 text-left",
                inMonth ? "bg-white" : "bg-gray-50 text-gray-400",
                selectedKey === day ? "ring-2 ring-inset ring-green-600" : "",
                day === today ? "bg-green-50/60" : "",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-semibold", day === today && inMonth ? "text-green-700" : "")}>{formatDay(day)}</span>
                {inMonth && occupied > 0 && (
                  <span className="text-[10px] font-semibold text-gray-500">{occupied}/{totalRooms}</span>
                )}
              </div>
              {inMonth && (
                <>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className={cn("h-full", occupancyTone(ratio))} style={{ width: `${Math.round(ratio * 100)}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {checkins > 0 && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">{checkins} in</span>}
                    {checkouts > 0 && <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">{checkouts} out</span>}
                    {extras.slice(0, 2).map((event) => (
                      <span key={event.id} className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium truncate max-w-full", KIND_PILL[event.kind])}>
                        {KIND_LABEL[event.kind]}
                      </span>
                    ))}
                    {extras.length > 2 && <span className="text-[10px] text-gray-400">+{extras.length - 2}</span>}
                  </div>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WeekBoard({
  days,
  eventsByDate,
  occupiedByDate,
  stays,
  totalRooms,
  selectedKey,
  onSelectDate,
  onSelectStay,
}: {
  days: string[]
  eventsByDate: Map<string, DayEvent[]>
  occupiedByDate: Map<string, Set<string>>
  stays: Stay[]
  totalRooms: number
  selectedKey: string
  onSelectDate: (key: string) => void
  onSelectStay: (stay: Stay) => void
}) {
  const today = todayKey()

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border">
      {days.map((day) => {
            const occupied = occupiedByDate.get(day)?.size || 0
        const dayEvents = collapseEvents(eventsByDate.get(day) || [])
        const arrivals = dayEvents.filter((event) => event.kind === "checkin")
        const departures = dayEvents.filter((event) => event.kind === "checkout")
        const extras = dayEvents.filter((event) => event.kind !== "checkin" && event.kind !== "checkout")
        const staying = stays.filter((stay) => occupiedOn(stay, day) && stay.roomNumber)
        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelectDate(day)}
            className={cn(
              "bg-white p-3 text-left min-h-[280px] align-top",
              selectedKey === day ? "ring-2 ring-inset ring-green-600" : "",
              day === today ? "bg-green-50/70" : "",
            )}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase text-gray-400">{formatDay(day, "weekday")}</span>
              <span className={cn("text-lg font-bold", day === today ? "text-green-700" : "text-gray-900")}>{formatDay(day)}</span>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">{occupied}/{totalRooms} occupied</p>
            <div className="space-y-1">
              {arrivals.map((event) => (
                <div
                  key={event.id}
                  className={cn("rounded px-1.5 py-1 text-[11px] font-medium truncate", KIND_PILL[event.kind])}
                  onClick={(click) => {
                    click.stopPropagation()
                    if (event.stay) onSelectStay(event.stay)
                  }}
                >
                  In · {event.title}
                </div>
              ))}
              {departures.map((event) => (
                <div
                  key={event.id}
                  className={cn("rounded px-1.5 py-1 text-[11px] font-medium truncate", KIND_PILL[event.kind])}
                  onClick={(click) => {
                    click.stopPropagation()
                    if (event.stay) onSelectStay(event.stay)
                  }}
                >
                  Out · {event.title}
                </div>
              ))}
              {staying.filter((stay) => stay.checkin !== day && stay.checkout !== day).slice(0, 4).map((stay) => (
                <div key={`stay-${stay.id}-${day}`} className="rounded bg-emerald-50 px-1.5 py-1 text-[11px] text-emerald-800 truncate">
                  {stay.roomNumber} · {stay.guest}
                </div>
              ))}
              {extras.slice(0, 3).map((event) => (
                <div key={event.id} className={cn("rounded px-1.5 py-1 text-[11px] truncate", KIND_PILL[event.kind])}>
                  {KIND_LABEL[event.kind]}
                </div>
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function DayPanel({
  date,
  events,
  inHouse,
  unassigned,
  occupied,
  totalRooms,
  onSelectStay,
}: {
  date: string
  events: DayEvent[]
  inHouse: Stay[]
  unassigned: Stay[]
  occupied: number
  totalRooms: number
  onSelectStay: (stay: Stay) => void
}) {
  const checkinEvents = events.filter((event) => event.kind === "checkin")
  const checkoutEvents = events.filter((event) => event.kind === "checkout")
  const checkins = collapseEvents(checkinEvents)
  const checkouts = collapseEvents(checkoutEvents)
  const others = events.filter((event) => event.kind !== "checkin" && event.kind !== "checkout")
  const overdue = others.filter((event) => event.overdue)

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4 xl:sticky xl:top-4 self-start">
      <div>
        <h3 className="font-semibold text-gray-900">{date ? formatDay(date, "long") : "Select a date"}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {countPhrase(checkinEvents.length, "check-in", "check-ins")} · {countPhrase(checkoutEvents.length, "check-out", "check-outs")} · {occupied}/{totalRooms} occupied
        </p>
      </div>

      {overdue.length > 0 && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {overdue.length} overdue credit{overdue.length === 1 ? "" : "s"} on this date.
        </div>
      )}

      <Section title="Arrivals" empty="No check-ins.">
        {checkins.map((event) => (
          <EventRow key={event.id} event={event} onOpen={event.stay ? () => onSelectStay(event.stay!) : undefined} />
        ))}
      </Section>
      <Section title="Departures" empty="No check-outs.">
        {checkouts.map((event) => (
          <EventRow key={event.id} event={event} onOpen={event.stay ? () => onSelectStay(event.stay!) : undefined} />
        ))}
      </Section>
      <Section title="In-house" empty="No rooms occupied.">
        {inHouse.map((stay) => (
          <button key={stay.id} type="button" onClick={() => onSelectStay(stay)} className="w-full text-left rounded-lg border p-2.5 hover:bg-gray-50">
            <p className="text-sm font-semibold text-gray-900">{stay.guest}</p>
            <p className="text-xs text-gray-500">{stay.roomNumber ? `Room ${stay.roomNumber}` : "Unassigned"} · {stay.status}</p>
          </button>
        ))}
      </Section>
      {unassigned.length > 0 && (
        <Section title="Needs a room" empty="">
          {unassigned.map((stay) => (
            <button key={stay.id} type="button" onClick={() => onSelectStay(stay)} className="w-full text-left rounded-lg border border-amber-200 bg-amber-50 p-2.5">
              <p className="text-sm font-semibold text-amber-950">{stay.guest}</p>
              <p className="text-xs text-amber-800">{stay.room} · {stay.status}</p>
            </button>
          ))}
        </Section>
      )}
      <Section title="Restaurant, payments & credits" empty="Nothing else on this date.">
        {others.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </Section>
    </div>
  )
}

function Section({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children]
  const hasItems = items.length > 0
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      {hasItems ? items : empty ? <p className="text-sm text-gray-400">{empty}</p> : null}
    </div>
  )
}

function EventRow({ event, onOpen }: { event: DayEvent; onOpen?: () => void }) {
  const className = cn("w-full text-left rounded-lg border p-2.5 space-y-1", onOpen ? "hover:bg-gray-50" : "", event.overdue ? "border-rose-200 bg-rose-50" : "")
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold", KIND_PILL[event.kind])}>
          {KIND_LABEL[event.kind]}
        </span>
        {event.kind === "order" && <UtensilsCrossed size={12} className="text-amber-700" />}
      </div>
      <p className="text-sm font-semibold text-gray-900">{event.title}</p>
      <p className="text-xs text-gray-600">{event.detail}</p>
      {event.amount ? <p className="text-xs font-medium text-gray-800">{formatMoney(event.amount, event.currency || "NPR")}</p> : null}
    </>
  )
  if (onOpen) {
    return <button type="button" onClick={onOpen} className={className}>{body}</button>
  }
  return <div className={className}>{body}</div>
}
