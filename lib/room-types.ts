import prisma from "@/lib/prisma"
import { STANDARD_ROOM_TYPES, canonicalizeRoomTypeName, isRejectedRoomTypeName, sortRoomTypes } from "@/lib/hotel"

function uniqueTargets(error: any): string[] {
  const target = error?.meta?.target
  if (Array.isArray(target)) return target.map(String)
  if (typeof target === "string") return [target]
  return []
}

async function syncRoomIdSequence() {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Room"', 'id'), COALESCE((SELECT MAX(id) FROM "Room"), 1))`
  )
}

async function renameRoomType(room: { id: number; name: string }, canonical: string) {
  await prisma.$transaction([
    prisma.room.update({
      where: { id: room.id },
      data: { name: canonical },
    }),
    prisma.roomInventory.updateMany({
      where: { roomTypeId: room.id },
      data: { roomType: canonical },
    }),
    prisma.booking.updateMany({
      where: { room: room.name },
      data: { room: canonical },
    }),
    prisma.businessRateCard.updateMany({
      where: { roomType: room.name },
      data: { roomType: canonical },
    }),
  ])
}

async function mergeRoomType(from: { id: number; name: string }, into: { id: number; name: string }) {
  await prisma.$transaction([
    prisma.roomInventory.updateMany({
      where: { roomTypeId: from.id },
      data: { roomTypeId: into.id, roomType: into.name },
    }),
    prisma.booking.updateMany({
      where: { room: from.name },
      data: { room: into.name },
    }),
    prisma.businessRateCard.deleteMany({
      where: { roomType: from.name },
    }),
    prisma.room.delete({ where: { id: from.id } }),
  ])
}

export async function ensureStandardRoomTypes() {
  const existing = await prisma.room.findMany({ orderBy: { id: "asc" } })
  for (const room of existing.filter((item) => isRejectedRoomTypeName(item.name))) {
    await prisma.roomInventory.deleteMany({ where: { roomTypeId: room.id } })
    await prisma.booking.updateMany({ where: { room: room.name }, data: { room: "Unassigned" } })
    await prisma.businessRateCard.deleteMany({ where: { roomType: room.name } })
    await prisma.room.delete({ where: { id: room.id } })
  }

  const remaining = await prisma.room.findMany({ orderBy: { id: "asc" } })
  const byName = new Map(remaining.map((room) => [room.name.toLowerCase(), room]))

  for (const room of remaining) {
    const canonical = canonicalizeRoomTypeName(room.name)
    if (!canonical || canonical === room.name) continue
    const target = byName.get(canonical.toLowerCase())
    if (target && target.id !== room.id) {
      await mergeRoomType(room, target)
      byName.delete(room.name.toLowerCase())
      continue
    }
    if (target) continue
    await renameRoomType(room, canonical)
    byName.delete(room.name.toLowerCase())
    byName.set(canonical.toLowerCase(), { ...room, name: canonical })
  }

  for (const type of STANDARD_ROOM_TYPES) {
    const current = byName.get(type.name.toLowerCase())
    if (current) {
      const price = Number(current.price)
      const isStub = (!Number.isFinite(price) || price <= 0) && (!current.image || current.image === "/placeholder.svg")
      if (isStub && (current.capacity !== type.capacity || !current.description)) {
        const updated = await prisma.room.update({
          where: { id: current.id },
          data: {
            capacity: type.capacity,
            description: current.description || type.description,
            features: current.features && current.features !== "[]" ? current.features : JSON.stringify([...type.features]),
          },
        })
        byName.set(type.name.toLowerCase(), updated)
      }
      continue
    }
    const data = {
      name: type.name,
      price: "0",
      currency: "NPR",
      description: type.description,
      capacity: type.capacity,
      status: "Available",
      features: JSON.stringify([...type.features]),
      rating: 0,
      image: "/placeholder.svg",
      roomNumbers: "",
    }
    try {
      const created = await prisma.room.create({ data })
      byName.set(type.name.toLowerCase(), created)
    } catch (error: any) {
      if (error?.code === "P2002" && uniqueTargets(error).includes("id")) {
        await syncRoomIdSequence()
        const created = await prisma.room.create({ data })
        byName.set(type.name.toLowerCase(), created)
      } else if (error?.code === "P2002") {
        continue
      } else {
        throw error
      }
    }
  }

  const rooms = await prisma.room.findMany()
  return sortRoomTypes(rooms)
}
